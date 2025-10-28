import React, { useState, useRef, useEffect } from "react";

type CssProps = {
    width?: string;
    height?: string;
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    border?: string;
    borderRadius?: string;
    padding?: string;
    margin?: string;
    display?: string;
};
export function Setting() {

    const [style, setStyle] = useState<CssProps>({
        width: "150px",
        height: "150px",
        backgroundColor: "lightblue",
        color: "black",
        fontSize: "16px",
        border: "1px solid #000",
        borderRadius: "4px",
        padding: "8px",
        margin: "8px",
        display: "block",
    });

    const [showPanel, setShowPanel] = useState(false);
    const [tempStyle, setTempStyle] = useState<CssProps>(style);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target as Node)
            ) {
                setShowPanel(false);
                setStyle(tempStyle); // Apply new styles when closing
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [tempStyle]);


    return (
        <div style={{ position: "relative", padding: "50px" }}>
            {/* Target Component */}
            <div
                style={{
                    ...style,
                    cursor: "pointer",
                }}
                onClick={(e) => {
                    e.stopPropagation(); // prevent immediate close
                    setTempStyle(style);
                    setShowPanel(true);
                }}
            >
                Editable Box
            </div>

            {/* Settings Panel */}
            {showPanel && (
                <div
                    ref={panelRef}
                    style={{
                        position: "absolute",
                        top: "220px",
                        left: "50px",
                        padding: "10px",
                        border: "1px solid #ccc",
                        background: "#fff",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        zIndex: 100,
                    }}
                >
                    <label>
                        Width:
                        <input
                            type="text"
                            value={tempStyle.width || ""}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, width: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Height:
                        <input
                            type="text"
                            value={tempStyle.height || ""}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, height: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Background:
                        <input
                            type="color"
                            value={tempStyle.backgroundColor || "#ffffff"}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, backgroundColor: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Text Color:
                        <input
                            type="color"
                            value={tempStyle.color || "#000000"}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, color: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Font Size:
                        <input
                            type="text"
                            value={tempStyle.fontSize || ""}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, fontSize: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Border:
                        <input
                            type="text"
                            value={tempStyle.border || ""}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, border: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Border Radius:
                        <input
                            type="text"
                            value={tempStyle.borderRadius || ""}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, borderRadius: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Padding:
                        <input
                            type="text"
                            value={tempStyle.padding || ""}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, padding: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Margin:
                        <input
                            type="text"
                            value={tempStyle.margin || ""}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, margin: e.target.value })
                            }
                        />
                    </label>
                    <br />
                    <label>
                        Display:
                        <select
                            value={tempStyle.display || "block"}
                            onChange={(e) =>
                                setTempStyle({ ...tempStyle, display: e.target.value })
                            }
                        >
                            <option value="block">block</option>
                            <option value="inline">inline</option>
                            <option value="inline-block">inline-block</option>
                            <option value="flex">flex</option>
                            <option value="grid">grid</option>
                            <option value="none">none</option>
                        </select>
                    </label>
                </div>
            )}
        </div>
    );
};
