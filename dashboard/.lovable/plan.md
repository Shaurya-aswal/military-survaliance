

## Mission Dashboard - Implementation Plan

### Overview
A professional "Mission Control" dashboard with the "Modern Enterprise Defense" theme featuring Deep Slate backgrounds, Electric Blue accents, and Inter font. The dashboard will have full navigation, live detection feed, activity monitoring, and interactive modal details.

---

### Page Structure

**1. Layout Framework**
- Full-screen dashboard with three-column layout
- Fixed left sidebar for navigation
- Top header bar with breadcrumbs and user profile
- Main content area with detection grid
- Collapsible right panel for recent activity

---

### Left Sidebar Navigation
- Narrow vertical bar with darkest slate background
- Four navigation icons with routes:
  - **Live Feed** (home/active state)
  - **History** (past detections)
  - **Analytics** (stats & charts)
  - **Settings** (configuration)
- Active route highlighted with Electric Blue accent
- Hover effects on all icons

---

### Top Header Bar
- **Left side:** Breadcrumb navigation ("Mission Control / Live Feed")
- **Right side:** User Profile Widget
  - Circular avatar with initials
  - Name display: "Commander Smith"
  - Rank/Role badge
  - Logout icon button

---

### Live Detection Feed (Main Content)
- Responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- **Detection Card Design:**
  - Dark card with subtle white border
  - 16:9 gradient placeholder with object type overlay
  - Status badge positioned top-right:
    - 🔴 Threat (red)
    - 🔵 Verified (blue)  
    - 🟡 Analyzing (amber)
  - Object name in bold white
  - Metadata: timestamp + confidence score
  - Full-width "View Details" ghost button
- **Hover interaction:** Border glows Electric Blue

---

### Detection Details Modal
- Opens when clicking "View Details"
- Displays expanded information:
  - Larger image view
  - Full detection metadata
  - Threat assessment details
  - Location/coordinates (mock data)
  - Action buttons (Acknowledge, Dismiss, Escalate)

---

### Recent Activity Panel (Right Side)
- Collapsible sidebar panel
- Scrollable activity log with timestamps
- Example entries:
  - "Commander Smith acknowledged alert #402"
  - "System scan completed"
  - "New threat detected in Sector 7"
- Toggle button to show/hide

---

### Visual Details
- **Loading state:** Skeleton pulse animation on cards
- **Color palette:** Slate-950/900/800 backgrounds, Blue-500 accents
- **Typography:** Inter font, clean hierarchy
- **Animations:** Smooth transitions on hover and panel toggle

---

### Pages to Create
1. **Live Feed** - Main detection dashboard (primary focus)
2. **History** - Simple list view placeholder
3. **Analytics** - Stats placeholder page
4. **Settings** - Configuration placeholder page

