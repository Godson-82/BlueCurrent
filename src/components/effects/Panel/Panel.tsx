import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import './Panel.css';

export interface PanelProps {
  tabs?: { label: string; content: React.ReactNode }[];
  defaultTab?: number;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  draggable?: boolean;
  resizable?: boolean;
  showHandle?: boolean;
  initialWidth?: string | number;
  initialHeight?: string | number;
  minWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  maxWidth?: number;
  onResize?: (width: number, height: number) => void;
  headerContent?: React.ReactNode;
  headerBackground?: string;
  children?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  tabs,
  defaultTab = 0,
  direction = 'top',
  className = '',
  draggable = false,
  resizable = false,
  showHandle = true,
  initialWidth = '100%',
  initialHeight = '100%',
  minWidth = 200,
  minHeight = 100,
  maxHeight = Infinity,
  maxWidth = Infinity,
  onResize,
  headerContent,
  headerBackground,
  children,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [dimensions, setDimensions] = useState({
    width: typeof initialWidth === 'number' ? initialWidth : 400,
    height: typeof initialHeight === 'number' ? initialHeight : 300,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const resizeStartRef = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    dirX: 0,
    dirY: 0,
  });

  const isHorizontal = direction === 'left' || direction === 'right';

  // Drag handlers
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable || !headerRef.current) return;
      const rect = headerRef.current.getBoundingClientRect();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        left: rect.left,
        top: rect.top,
      };
    },
    [draggable]
  );

  // Resize handlers
  const onResizeStart = useCallback(
    (e: React.MouseEvent, dirX: number, dirY: number) => {
      if (!resizable) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: dimensions.width,
        height: dimensions.height,
        dirX,
        dirY,
      };
    },
    [resizable, dimensions]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && headerRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        headerRef.current.style.left = `${dragStartRef.current.left + dx}px`;
        headerRef.current.style.top = `${dragStartRef.current.top + dy}px`;
      }

      if (isResizing) {
        const { x, y, width, height, dirX, dirY } = resizeStartRef.current;
        const dx = e.clientX - x;
        const dy = e.clientY - y;

        const newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, width + dirX * dx)
        );
        const newHeight = Math.max(
          minHeight,
          Math.min(maxHeight, height + dirY * dy)
        );

        setDimensions({ width: newWidth, height: newHeight });
        onResize?.(newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, minWidth, maxWidth, minHeight, maxHeight, onResize]);

  const style = useMemo(() => ({
    width: resizable ? dimensions.width : initialWidth,
    height: resizable ? dimensions.height : initialHeight,
  }), [resizable, dimensions, initialWidth, initialHeight]);

  const renderTabs = () => {
    if (!tabs || tabs.length === 0) return null;

    const tabButtons = (
      <div className={`panel-tab-list ${direction}`}>
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            className={`panel-tab ${idx === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );

    const tabContent = tabs[activeTab]?.content;

    if (direction === 'left' || direction === 'right') {
      return (
        <div className={`panel-vertical-tabs ${direction}`}>
          {tabButtons}
          <div className="panel-tab-content">{tabContent}</div>
        </div>
      );
    }

    return (
      <>
        {tabButtons}
        <div className="panel-tab-content">{tabContent}</div>
      </>
    );
  };

  return (
    <div
      ref={panelRef}
      className={`panel ${className}`}
      style={style}
    >
      <div
        ref={headerRef}
        className={`panel-header ${direction} ${draggable ? 'draggable' : ''} ${isDragging ? 'active' : ''}`}
        style={headerBackground ? { background: headerBackground } : undefined}
        onMouseDown={onDragStart}
      >
        {headerContent || (tabs && tabs[activeTab]?.label && (
          <span className="panel-header-title">{tabs[activeTab].label}</span>
        ))}
      </div>

      {renderTabs()}
      <div className="panel-content">{children}</div>

      {resizable && showHandle && (
        <>
          <div
            className="panel-handle right"
            onMouseDown={(e) => onResizeStart(e, 1, 0)}
          />
          <div
            className="panel-handle bottom"
            onMouseDown={(e) => onResizeStart(e, 0, 1)}
          />
          <div
            className="panel-handle top"
            onMouseDown={(e) => onResizeStart(e, 0, -1)}
          />
          <div
            className="panel-handle left"
            onMouseDown={(e) => onResizeStart(e, -1, 0)}
          />
          <div
            className="panel-handle top right"
            onMouseDown={(e) => onResizeStart(e, 1, -1)}
          />
          <div
            className="panel-handle top left"
            onMouseDown={(e) => onResizeStart(e, -1, -1)}
          />
          <div
            className="panel-handle bottom right"
            onMouseDown={(e) => onResizeStart(e, 1, 1)}
          />
          <div
            className="panel-handle bottom left"
            onMouseDown={(e) => onResizeStart(e, -1, 1)}
          />
        </>
      )}
    </div>
  );
};
