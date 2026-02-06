import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DetectionCard } from '@/components/dashboard/DetectionCard';
import { DetectionCardSkeleton } from '@/components/dashboard/DetectionCardSkeleton';
import { DetectionModal } from '@/components/dashboard/DetectionModal';
import { mockDetections } from '@/data/mockData';
import { Detection } from '@/types/detection';

export default function LiveFeed() {
  const [isLoading, setIsLoading] = useState(true);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDetections(mockDetections);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleViewDetails = (detection: Detection) => {
    setSelectedDetection(detection);
    setModalOpen(true);
  };

  return (
    <DashboardLayout breadcrumb={['Mission Control', 'Live Feed']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Live Detection Feed</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time monitoring of all active contacts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <DetectionCardSkeleton key={i} />
              ))
            : detections.map((detection) => (
                <DetectionCard
                  key={detection.id}
                  detection={detection}
                  onViewDetails={handleViewDetails}
                />
              ))}
        </div>
      </div>

      <DetectionModal
        detection={selectedDetection}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </DashboardLayout>
  );
}
