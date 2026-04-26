/**
 * Returns consistent Ant Design Modal props for mobile vs desktop.
 *
 * Mobile: centered, 20px margin on every side, scrollable body.
 * Desktop: original width is kept by the caller — no overrides needed.
 *
 * Usage:
 *   <Modal {...mobileModalProps(isMobile, 680)} title="…" open={open}>
 */
export function mobileModalProps(isMobile, desktopWidth = 520) {
  if (!isMobile) {
    return { width: desktopWidth }
  }
  return {
    centered: true,
    width: 'calc(100vw - 40px)',   // 20px margin each side
    style: {},
    styles: {
      body: {
        maxHeight: '75vh',
        overflowY: 'auto',
      },
    },
  }
}
