import styles from "./App.module.css";
import { useRef, useEffect } from "react";

/** Generic page item that can be displayed in the sidebar */
export type SidebarItem = {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
};

/** Props for the PageSidebar component */
type Props<T extends SidebarItem> = {
  /** Title shown in sidebar header */
  title: string;
  /** Array of items to display */
  items: T[];
  /** ID of the currently active item */
  activeItemId: string;
  /** Callback when an item is selected */
  onSelectItem: (id: string) => void;
  /** Callback when an item is renamed */
  onRenameItem?: (id: string, name: string) => void;
  /** Callback when an item is deleted */
  onDeleteItem?: (id: string) => void;
  /** Callback to add a new item */
  onAddItem?: () => void;
  /** Callback to duplicate the active item */
  onDuplicateItem?: () => void;
  /** ID of item currently being edited, if any */
  editingId: string | null;
  /** Callback to set which item is being edited */
  onSetEditingId: (id: string | null) => void;
  /** Whether sidebar is expanded */
  expanded: boolean;
  /** Callback to toggle sidebar expansion */
  onToggleExpanded: () => void;
  /** Whether to show action buttons (New/Duplicate) */
  showActions?: boolean;
  /** Whether items can be deleted (min 1 item required) */
  allowDelete?: boolean;
};

/**
 * Reusable sidebar component for displaying a list of pages/items
 * Used for both Drawing pages and Mockup pages
 */
export default function PageSidebar<T extends SidebarItem>({
  title,
  items,
  activeItemId,
  onSelectItem,
  onRenameItem,
  onDeleteItem,
  onAddItem,
  onDuplicateItem,
  editingId,
  onSetEditingId,
  expanded,
  onToggleExpanded,
  showActions = true,
  allowDelete = true,
}: Props<T>) {
  /** Refs to item DOM elements for scrolling */
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /** Scroll active item into view when it changes */
  useEffect(() => {
    const el = itemRefs.current[activeItemId];
    if (el) {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeItemId, items.length]);

  return (
    <>
      {/* Toggle button - positioned outside sidebar */}
      <button
        className={styles.sidebarToggle}
        onClick={onToggleExpanded}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        title={expanded ? "Collapse sidebar" : "Expand sidebar"}
        style={{ left: expanded ? '300px' : '0px' }}
      >
        {expanded ? '«' : '»'}
      </button>

      {/* Sidebar content */}
      <aside className={`${styles.sidebar} ${!expanded ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.sidebarHeader}>{title}</div>

        <div className={styles.pageList}>
          {items.map((item) => {
            const selected = item.id === activeItemId;
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                ref={(node) => { itemRefs.current[item.id] = node; }}
                className={
                  styles.pageItem + " " + (selected ? styles.pageItemSelected : "")
                }
                onClick={() => {
                  onSelectItem(item.id);
                  onSetEditingId(null);
                }}
                onDoubleClick={(e) => {
                  if (onRenameItem) {
                    e.stopPropagation();
                    onSetEditingId(item.id);
                  }
                }}
                title={item.name}
              >
                <div className={styles.pageItemLabel}>
                  {/* tiny page icon (pure CSS) */}
                  <span className={styles.pageIcon} aria-hidden />
                  {isEditing && onRenameItem ? (
                    <input
                      className={styles.pageNameInput}
                      autoFocus
                      value={item.name}
                      onChange={(e) => onRenameItem(item.id, e.target.value)}
                      onBlur={() => onSetEditingId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") onSetEditingId(null);
                      }}
                      spellCheck={false}
                    />
                  ) : (
                    <span className={styles.pageNameText}>{item.name}</span>
                  )}
                </div>

                {allowDelete && items.length > 1 && onDeleteItem && (
                  <button
                    className={styles.pageDeleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    aria-label="Delete item"
                    title="Delete item"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showActions && (onAddItem || onDuplicateItem) && (
          <div className={styles.sidebarFooter}>
            {onAddItem && (
              <button className={styles.sidebarBtn} onClick={onAddItem} title="New item">
                + New
              </button>
            )}
            {onDuplicateItem && (
              <button
                className={styles.sidebarBtn}
                onClick={onDuplicateItem}
                title="Duplicate current item"
              >
                Duplicate
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}