import { useEffect, useRef, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useDetectionHistory, AnalysisRecord } from '@/store/detectionHistory';
import { MapPin, Crosshair, Layers, AlertTriangle, Shield, Clock, Trash2 } from 'lucide-react';

// ── OpenLayers imports ──────────────────────────────────────────────
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import 'ol/ol.css';

// ── Color scheme per status ─────────────────────────────────────────
const STATUS_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  threat:    { fill: 'rgba(239,68,68,0.85)',   stroke: 'rgba(239,68,68,1)',   label: 'Threat' },
  verified:  { fill: 'rgba(34,197,94,0.85)',    stroke: 'rgba(34,197,94,1)',   label: 'Verified' },
  analyzing: { fill: 'rgba(245,158,11,0.85)',   stroke: 'rgba(245,158,11,1)',  label: 'Analyzing' },
};

function getStatusFromRecord(r: AnalysisRecord): string {
  if (r.threats > 0) return 'threat';
  if (r.verified > 0) return 'verified';
  return 'analyzing';
}

function markerStyle(status: string, isHovered = false): Style {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.analyzing;
  return new Style({
    image: new CircleStyle({
      radius: isHovered ? 12 : 8,
      fill: new Fill({ color: c.fill }),
      stroke: new Stroke({ color: c.stroke, width: isHovered ? 3 : 2 }),
    }),
  });
}

// ── Popup content builder ───────────────────────────────────────────
function buildPopupHTML(record: AnalysisRecord): string {
  const status = getStatusFromRecord(record);
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.analyzing;
  const ts = new Date(record.timestamp);
  const timeStr = ts.toLocaleString();

  const imageBlock = record.annotatedImageBase64
    ? `<img src="data:image/jpeg;base64,${record.annotatedImageBase64}"
           class="threat-map-popup-img" />`
    : `<div class="threat-map-popup-noimg">No annotated image</div>`;

  const detRows = record.detections
    .map(
      (d) =>
        `<tr>
          <td style="padding:3px 6px;font-weight:500;">${d.objectName}</td>
          <td style="padding:3px 6px;text-align:center;">${d.confidenceScore}%</td>
          <td style="padding:3px 6px;text-align:center;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${STATUS_COLORS[d.status]?.fill ?? '#999'};margin-right:4px;"></span>
            ${d.status}
          </td>
        </tr>`,
    )
    .join('');

  return `
    <div class="threat-map-popup">
      <div class="threat-map-popup-header" style="border-left:4px solid ${color.stroke};">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;">${record.imageName}</div>
        <div style="font-size:11px;color:#94a3b8;">${timeStr}</div>
      </div>
      ${imageBlock}
      <div class="threat-map-popup-stats">
        <span title="Detections">🎯 ${record.totalDetections}</span>
        <span title="Threats" style="color:#ef4444;">⚠ ${record.threats}</span>
        <span title="Verified" style="color:#22c55e;">✓ ${record.verified}</span>
        <span title="Processing time">⏱ ${record.processingTimeMs.toFixed(0)}ms</span>
      </div>
      ${
        record.detections.length > 0
          ? `<table class="threat-map-popup-table">
              <thead><tr>
                <th style="padding:3px 6px;text-align:left;">Object</th>
                <th style="padding:3px 6px;text-align:center;">Conf.</th>
                <th style="padding:3px 6px;text-align:center;">Status</th>
              </tr></thead>
              <tbody>${detRows}</tbody>
            </table>`
          : ''
      }
      <div style="text-align:center;padding:4px 0 2px;">
        <span style="font-size:10px;color:#64748b;">
          📍 ${record.coordinates?.lat.toFixed(5)}, ${record.coordinates?.lng.toFixed(5)}
        </span>
      </div>
      <div style="text-align:center;padding:4px 0 8px;">
        <button data-delete-id="${record.id}" style="font-size:11px;color:#ef4444;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:4px 12px;cursor:pointer;transition:background 0.15s;">
          🗑 Remove
        </button>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════
export default function ThreatMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const overlayRef = useRef<Overlay | null>(null);

  const analyses = useDetectionHistory((s) => s.analyses);
  const removeAnalysis = useDetectionHistory((s) => s.removeAnalysis);
  const clearAll = useDetectionHistory((s) => s.clearAll);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // ── Get user location once ────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.longitude, pos.coords.latitude]),
      () => {/* denied – fall back to default center */},
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  // ── Initialize map ────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = userLocation ?? [0, 0];

    const overlay = new Overlay({
      element: popupRef.current!,
      autoPan: { animation: { duration: 250 } },
      positioning: 'bottom-center',
      offset: [0, -14],
    });
    overlayRef.current = overlay;

    const map = new Map({
      target: mapRef.current,
      layers: [
        // Dark / tactical tile layer (CartoDB Dark Matter)
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attributions: '&copy; <a href="https://carto.com/">CARTO</a>',
          }),
        }),
        new VectorLayer({
          source: vectorSourceRef.current,
        }),
      ],
      overlays: [overlay],
      view: new View({
        center: fromLonLat(defaultCenter),
        zoom: userLocation ? 14 : 2,
        maxZoom: 19,
        minZoom: 2,
      }),
    });

    // ── Pointer interactions ────────────────────────────────────
    let hoveredFeature: Feature | null = null;

    map.on('pointermove', (evt) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';

      // Reset previous hover style
      if (hoveredFeature) {
        const st = hoveredFeature.get('_status') as string;
        hoveredFeature.setStyle(markerStyle(st, false));
        hoveredFeature = null;
      }

      if (hit) {
        map.forEachFeatureAtPixel(pixel, (f) => {
          const feature = f as Feature;
          const st = feature.get('_status') as string;
          feature.setStyle(markerStyle(st, true));
          hoveredFeature = feature;

          // Show popup on hover
          const record = feature.get('_record') as AnalysisRecord;
          if (record && popupRef.current) {
            popupRef.current.innerHTML = buildPopupHTML(record);
            overlay.setPosition((feature.getGeometry() as Point).getCoordinates());
          }
          return true; // stop iterating
        });
      }
    });

    map.on('click', (evt) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      let clicked = false;
      map.forEachFeatureAtPixel(pixel, (f) => {
        const feature = f as Feature;
        const record = feature.get('_record') as AnalysisRecord;
        if (record && popupRef.current) {
          popupRef.current.innerHTML = buildPopupHTML(record);
          overlay.setPosition((feature.getGeometry() as Point).getCoordinates());
          clicked = true;
        }
        return true;
      });
      if (!clicked) {
        overlay.setPosition(undefined);
      }
    });

    mapInstanceRef.current = map;
    setMapReady(true);

    // ── Popup delete button handler (event delegation) ──────────
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('[data-delete-id]') as HTMLElement | null;
      if (btn) {
        const id = btn.getAttribute('data-delete-id');
        if (id && window.confirm('Delete this analysis record?')) {
          useDetectionHistory.getState().removeAnalysis(id);
          overlay.setPosition(undefined);
        }
      }
    };
    popupRef.current?.addEventListener('click', handlePopupClick);

    return () => {
      popupRef.current?.removeEventListener('click', handlePopupClick);
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // ── Sync analyses → features ──────────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    const src = vectorSourceRef.current;
    src.clear();

    const withCoords = analyses.filter((a) => a.coordinates);
    if (withCoords.length === 0) return;

    withCoords.forEach((record) => {
      const { lng, lat } = record.coordinates!;
      const status = getStatusFromRecord(record);
      const feature = new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
        _record: record,
        _status: status,
      });
      feature.setStyle(markerStyle(status));
      src.addFeature(feature);
    });

    // Auto-center on latest detection
    const latest = withCoords[0]; // analyses are unshift-ed (newest first)
    if (latest?.coordinates) {
      mapInstanceRef.current?.getView().animate({
        center: fromLonLat([latest.coordinates.lng, latest.coordinates.lat]),
        zoom: 15,
        duration: 600,
      });
    }
  }, [analyses, mapReady]);

  // ── Center on user ────────────────────────────────────────────
  const centerOnUser = useCallback(() => {
    if (!userLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.getView().animate({
      center: fromLonLat(userLocation),
      zoom: 15,
      duration: 500,
    });
  }, [userLocation]);

  // ── Center on latest ──────────────────────────────────────────
  const centerOnLatest = useCallback(() => {
    const latest = analyses.find((a) => a.coordinates);
    if (!latest?.coordinates || !mapInstanceRef.current) return;
    mapInstanceRef.current.getView().animate({
      center: fromLonLat([latest.coordinates.lng, latest.coordinates.lat]),
      zoom: 16,
      duration: 500,
    });
  }, [analyses]);

  // ── Stats ─────────────────────────────────────────────────────
  const totalMarkers = analyses.filter((a) => a.coordinates).length;
  const totalThreats = analyses.filter((a) => a.coordinates && a.threats > 0).length;
  const totalVerified = analyses.filter((a) => a.coordinates && a.verified > 0).length;

  return (
    <DashboardLayout breadcrumb={['Dashboard', 'Threat Map']}>
      {/* Inline styles for popup (avoids external CSS file) */}
      <style>{`
        .threat-map-popup {
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(51, 65, 85, 0.7);
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          width: min(320px, 90vw);
          max-height: 420px;
          overflow-y: auto;
          font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
          font-size: 12px;
          color: #cbd5e1;
          backdrop-filter: blur(12px);
        }
        .threat-map-popup-header {
          padding: 8px 10px;
          background: rgba(30, 41, 59, 0.8);
          border-radius: 10px 10px 0 0;
        }
        .threat-map-popup-img {
          width: 100%;
          max-height: 180px;
          object-fit: cover;
          border-top: 1px solid rgba(51,65,85,0.5);
          border-bottom: 1px solid rgba(51,65,85,0.5);
        }
        .threat-map-popup-noimg {
          padding: 20px;
          text-align: center;
          color: #475569;
          font-style: italic;
          border-top: 1px solid rgba(51,65,85,0.5);
          border-bottom: 1px solid rgba(51,65,85,0.5);
        }
        .threat-map-popup-stats {
          display: flex;
          justify-content: space-around;
          padding: 6px 4px;
          font-size: 11px;
          font-weight: 600;
          border-bottom: 1px solid rgba(51,65,85,0.4);
        }
        .threat-map-popup-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .threat-map-popup-table thead {
          background: rgba(30,41,59,0.6);
          color: #94a3b8;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .threat-map-popup-table tbody tr {
          border-top: 1px solid rgba(51,65,85,0.3);
        }
        .threat-map-popup-table tbody tr:hover {
          background: rgba(51,65,85,0.25);
        }
        /* OL attribution tweak */
        .ol-attribution {
          font-size: 10px !important;
          background: rgba(15,23,42,0.7) !important;
          color: #64748b !important;
        }
        .ol-attribution a { color: #60a5fa !important; }
        /* Hide popup arrow area */
        .ol-overlay-container { overflow: visible; }
      `}</style>

      <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-6 pb-20 md:pb-6" style={{ height: 'calc(100vh - 56px)' }}>
        {/* ── Header bar ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-500/20 shrink-0">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Tactical Threat Map
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400">
                Geolocated analysis results &middot; Real-time overlay
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-slate-300 font-medium">{totalMarkers}</span>
              <span className="text-slate-500 hidden sm:inline">markers</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-400 font-medium">{totalThreats}</span>
              <span className="text-slate-500 hidden sm:inline">threats</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">{totalVerified}</span>
              <span className="text-slate-500 hidden sm:inline">verified</span>
            </div>
            {totalMarkers > 0 && (
              <button
                onClick={() => { if (window.confirm('Delete ALL analysis records? This cannot be undone.')) clearAll(); }}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Map container ───────────────────────────────────────── */}
        <div className="relative flex-1 min-h-0 rounded-lg sm:rounded-xl border border-[hsl(217,33%,17%)] overflow-hidden">
          <div ref={mapRef} className="w-full h-full" />

          {/* Popup container (positioned by OL overlay) */}
          <div ref={popupRef} />

          {/* Floating controls */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1.5 sm:gap-2 z-10">
            <button
              onClick={centerOnUser}
              disabled={!userLocation}
              title="Center on your location"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <Crosshair className="h-4 w-4" />
            </button>
            <button
              onClick={centerOnLatest}
              disabled={totalMarkers === 0}
              title="Center on latest detection"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-2 sm:gap-3 rounded-lg bg-slate-900/80 border border-slate-700/60 px-2 sm:px-3 py-1.5 sm:py-2 backdrop-blur-sm z-10">
            {Object.entries(STATUS_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-slate-300">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: val.fill, border: `1.5px solid ${val.stroke}` }}
                />
                {val.label}
              </div>
            ))}
          </div>

          {/* Empty state */}
          {totalMarkers === 0 && mapReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center px-6 py-8 bg-slate-900/60 rounded-2xl border border-slate-700/40 backdrop-blur-md pointer-events-auto">
                <MapPin className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300 mb-1">
                  No Geolocated Detections
                </h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Run an image analysis from the{' '}
                  <span className="text-blue-400">Image Analysis</span> page to
                  plot detection markers on this map. Allow location access for
                  accurate positioning.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
