import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Ellipse,
  Text as KText,
  Image as KImage,
  Transformer,
} from "react-konva";
import Konva from "konva";

// -------- Types --------
type Tool = "pen" | "eraser" | "shape" | "text";
type ShapeKind = "rect" | "ellipse";

type BaseShape = {
  id: string;
  type: "line" | "rect" | "ellipse" | "text" | "image";
  draggable?: boolean;
};

type LineShape = BaseShape & {
  type: "line";
  points: number[];
  color: string;
  strokeWidth: number;
  erasing?: boolean;
};

type RectShape = BaseShape & {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
};

type EllipseShape = BaseShape & {
  type: "ellipse";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
};

type TextShape = BaseShape & {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  width?: number;
  height?: number;
};

type ImageShape = BaseShape & {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
};

type AnyShape = LineShape | RectShape | EllipseShape | TextShape | ImageShape;

// -------- Imperative API for parent (Navbar) --------
export type DrawingHandle = {
  exportForBackend: () => Promise<void>;
  exportPNGDownload: () => void;
  getPNGDataURL: () => string | null;
};

export interface DrawingProps {
  onExportImage?: (pngDataUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

// -------- Utils --------
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const ToolbarButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  ...props
}) => (
  <button
    {...props}
    style={{
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,.04)",
      cursor: props.disabled ? "not-allowed" : "pointer",
      marginRight: 8,
      opacity: props.disabled ? 0.5 : 1,
      ...props.style,
    }}
  >
    {children}
  </button>
);

const Separator = () => <span style={{ width: 8, display: "inline-block" }} />;

// -------- Component --------
const Drawing = forwardRef<DrawingHandle, DrawingProps>(function Drawing(
  { onExportImage, width, height, className },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const isDrawing = useRef(false);

  const [stageSize, setStageSize] = useState({
    w: width ?? 800,
    h: height ?? 600,
  });

  // Tools
  const [tool, setTool] = useState<Tool>("pen");
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect");
  const [color, setColor] = useState("#111827");
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Scene state
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [placingId, setPlacingId] = useState<string | null>(null); // for shapes only
  const [textSelectedId, setTextSelectedId] = useState<string | null>(null); // selected for resize (when not editing)

  // Inline text editor overlay (invisible; just captures keyboard)
  const [textEditor, setTextEditor] = useState<{
    active: boolean;
    id: string | null;
    value: string;
    x: number; // screen coords
    y: number; // screen coords
    width: number;
    fontSize: number;
    fill: string;
  }>({
    active: false,
    id: null,
    value: "",
    x: 0,
    y: 0,
    width: 200,
    fontSize: 20,
    fill: color,
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Flags to keep editing while transforming
  const isTransformingRef = useRef(false);
  const transformClickRef = useRef(false);

  // History
  const [history, setHistory] = useState<AnyShape[][]>([[]]);
  const [redoStack, setRedoStack] = useState<AnyShape[][]>([]);

  // Background image
  const [bgImage, setBgImage] = useState<ImageShape | null>(null);
  const [bgHTMLImage, setBgHTMLImage] = useState<HTMLImageElement | null>(null);

  // -------- Responsive stage --------
  useEffect(() => {
    if (!containerRef.current || width || height) return;
    const ro = new ResizeObserver(() => {
      const rect = containerRef.current!.getBoundingClientRect();
      setStageSize({ w: rect.width, h: rect.height - 56 });

      // keep textarea aligned while editing
      if (textEditor.active && textEditor.id) {
        const t = shapes.find((s) => s.id === textEditor.id && s.type === "text") as
          | TextShape
          | undefined;
        if (t) {
          setTextEditor((prev) => ({
            ...prev,
            x: rect.left + t.x,
            y: rect.top + t.y,
          }));
        }
      }
    });
    ro.observe(containerRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    setStageSize({ w: rect.width, h: rect.height - 56 });
    return () => ro.disconnect();
  }, [width, height, textEditor.active, textEditor.id, shapes]);

  // -------- Transformer binding --------
  // During shape placement -> transformer on placing node.
  // For text: if editing -> transformer on editing id; else on textSelectedId.
  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;

    let node: Konva.Node | null = null;
    if (placingId) {
      node = stage.findOne(`#${placingId}`) as Konva.Node | null;
    } else if (tool === "text") {
      if (textEditor.active && textEditor.id) {
        node = stage.findOne(`#${textEditor.id}`) as Konva.Node | null;
      } else if (textSelectedId) {
        node = stage.findOne(`#${textSelectedId}`) as Konva.Node | null;
      }
    }

    tr.nodes(node ? [node] : []);
    tr.rotateEnabled(true);
    tr.getLayer()?.batchDraw();
  }, [placingId, tool, textSelectedId, textEditor.active, textEditor.id, shapes]);

  // -------- History helpers --------
  const commitHistory = useCallback((next: AnyShape[]) => {
    setHistory((h) => [...h, next]);
    setRedoStack([]);
  }, []);

  // -------- Grid --------
  const gridLines = useMemo(() => {
    const step = 20;
    const lines: LineShape[] = [];
    for (let x = 0; x < stageSize.w; x += step) {
      lines.push({
        id: `grid-v-${x}`,
        type: "line",
        points: [x, 0, x, stageSize.h],
        color: "#f3f4f6",
        strokeWidth: 1,
        draggable: false,
      });
    }
    for (let y = 0; y < stageSize.h; y += step) {
      lines.push({
        id: `grid-h-${y}`,
        type: "line",
        points: [0, y, stageSize.w, y],
        color: "#f3f4f6",
        strokeWidth: 1,
        draggable: false,
      });
    }
    return lines;
  }, [stageSize.w, stageSize.h]);

  // -------- Export helpers --------
  const getPNGDataURL = () => {
    if (!stageRef.current) return null;
    return stageRef.current.toDataURL({ pixelRatio: 2 });
  };

  const dataURLToBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const exportForBackend = async () => {
    const dataUrl = getPNGDataURL();
    if (!dataUrl) return;
    const blob = await dataURLToBlob(dataUrl);
    const form = new FormData();
    form.append("file", blob, "sketch.png");
    form.append("canvas_w", String(stageSize.w));
    form.append("canvas_h", String(stageSize.h));
    await fetch("/api/generate/", { method: "POST", body: form });
  };

  const exportPNGDownload = () => {
    if (!stageRef.current) return;
    const url = stageRef.current.toDataURL({ pixelRatio: 2 });
    onExportImage?.(url);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sketch.png";
    a.click();
  };

  // -------- Expose API to parent --------
  useImperativeHandle(
    ref,
    () => ({
      exportForBackend,
      exportPNGDownload,
      getPNGDataURL,
    }),
    [stageSize.w, stageSize.h]
  );

  // -------- Inline text editor helpers --------
  const openInlineEditor = useCallback(
    (id: string) => {
      const t = shapes.find((s) => s.id === id && s.type === "text") as TextShape | undefined;
      if (!t || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      setTextEditor({
        active: true,
        id: t.id,
        value: t.text,
        x: rect.left + t.x,
        y: rect.top + t.y,
        width: Math.max(20, t.width ?? 200),
        fontSize: t.fontSize,
        fill: t.fill,
      });

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        const len = t.text.length;
        textareaRef.current?.setSelectionRange(len, len);
      });

      setTextSelectedId(null); // transformer will attach to editing id
    },
    [shapes]
  );

  const closeInlineEditor = useCallback(
    (commit: boolean) => {
      setTextEditor((prev) => {
        if (!prev.active || !prev.id) return prev;

        if (commit) {
          if (!prev.value.trim()) {
            const next = shapes.filter((s) => s.id !== prev.id);
            setShapes(next);
            commitHistory(next);
          } else {
            const next = shapes.map((s) =>
              s.id === prev.id ? ({ ...s, text: prev.value, width: prev.width } as AnyShape) : s
            );
            setShapes(next);
            commitHistory(next);
          }
        }
        return { ...prev, active: false, id: null };
      });
    },
    [shapes, commitHistory]
  );

  // -------- Mouse handlers --------
  const handleMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // If typing and click happens
    if (textEditor.active) {
      const targetClass = e.target?.getClassName?.();
      const parentClass = e.target?.getParent?.()?.getClassName?.();
      const isTransformer = targetClass === "Transformer" || parentClass === "Transformer";
      const isText = targetClass === "Text";

      // Click on transformer -> keep editing (suppress blur commit)
      if (isTransformer) {
        transformClickRef.current = true;
        setTimeout(() => (transformClickRef.current = false), 0);
        return;
      }

      // Click on another text -> commit current, open that one
      if (isText) {
        const clickedId = e.target.attrs.id as string | undefined;
        if (clickedId && clickedId !== textEditor.id) {
          closeInlineEditor(true);
          openInlineEditor(clickedId);
        }
        return;
      }

      // Click elsewhere -> commit
      closeInlineEditor(true);
      return;
    }

    if (tool === "pen" || tool === "eraser") {
      isDrawing.current = true;
      const newLine: LineShape = {
        id: uid("line"),
        type: "line",
        points: [pos.x, pos.y],
        color,
        strokeWidth: tool === "eraser" ? strokeWidth * 2 : strokeWidth,
        erasing: tool === "eraser",
        draggable: false,
      };
      setShapes((prev) => [...prev, newLine]);
      return;
    }

    if (tool === "shape") {
      isDrawing.current = true;
      if (shapeKind === "rect") {
        const r: RectShape = {
          id: uid("rect"),
          type: "rect",
          x: pos.x,
          y: pos.y,
          width: 1,
          height: 1,
          stroke: color,
          strokeWidth,
          draggable: true, // only during placement
        };
        setShapes((prev) => [...prev, r]);
        setPlacingId(r.id);
      } else {
        const el: EllipseShape = {
          id: uid("ellipse"),
          type: "ellipse",
          x: pos.x,
          y: pos.y,
          radiusX: 1,
          radiusY: 1,
          stroke: color,
          strokeWidth,
          draggable: true, // only during placement
        };
        setShapes((prev) => [...prev, el]);
        setPlacingId(el.id);
      }
      return;
    }

    if (tool === "text") {
      const targetClass = e.target?.getClassName?.();
      const parentClass = e.target?.getParent?.()?.getClassName?.();
      const isTransformer = targetClass === "Transformer" || parentClass === "Transformer";

      // Click existing text -> edit inline (single click)
      if (targetClass === "Text") {
        const id = e.target.attrs.id as string | undefined;
        if (id) openInlineEditor(id);
        return;
      }

      if (isTransformer) return;

      // Click empty stage -> create text and immediately enter editing
      if (e.target === stage) {
        const id = uid("text");
        const t: TextShape = {
          id,
          type: "text",
          x: pos.x,
          y: pos.y,
          text: "",
          fontSize: 20,
          fill: color,
          draggable: true, // allow moving via transformer while editing
          width: 200,
        };
        setShapes((prev) => [...prev, t]);

        const rect = containerRef.current!.getBoundingClientRect();
        setTextEditor({
          active: true,
          id,
          value: "",
          x: rect.left + pos.x,
          y: rect.top + pos.y,
          width: 200,
          fontSize: 20,
          fill: color,
        });

        requestAnimationFrame(() => textareaRef.current?.focus());
        setTextSelectedId(null);
        return;
      }
      return;
    }
  };

  const handleMouseMove = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos || !isDrawing.current) return;

    if (tool === "pen" || tool === "eraser") {
      setShapes((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.type !== "line") return prev;
        const updated: LineShape = {
          ...(last as LineShape),
          points: [...(last as LineShape).points, pos.x, pos.y],
        };
        return [...prev.slice(0, prev.length - 1), updated];
      });
    } else if (tool === "shape") {
      setShapes((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        if (last.type === "rect") {
          const r = last as RectShape;
          const width = pos.x - r.x;
          const height = pos.y - r.y;
          const updated = { ...r, width, height };
          return [...prev.slice(0, prev.length - 1), updated];
        } else if (last.type === "ellipse") {
          const el = last as EllipseShape;
          const radiusX = Math.abs(pos.x - el.x);
          const radiusY = Math.abs(pos.y - el.y);
          const updated = { ...el, radiusX, radiusY };
          return [...prev.slice(0, prev.length - 1), updated];
        }
        return prev;
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      setShapes((prev) => {
        const next = [...prev];
        commitHistory(next);
        return next;
      });
    }
    if (tool === "shape") setPlacingId(null);
  };

  // -------- Shape update helper --------
  const updateShape = useCallback(
    (id: string, attrs: Partial<AnyShape>, commit = false) => {
      setShapes((prev) => {
        const next = prev.map((s) => (s.id === id ? ({ ...s, ...attrs } as AnyShape) : s));
        if (commit) commitHistory(next);
        return next;
      });
    },
    [commitHistory]
  );

  // -------- Undo / Redo --------
  const undo = useCallback(() => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const newState = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setShapes(newState);
    setRedoStack((r) => [history[history.length - 1], ...r]);
    setPlacingId(null);
    setTextSelectedId(null);
    setTextEditor((e) => ({ ...e, active: false, id: null }));
  }, [history]);

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const [first, ...rest] = r;
      setShapes(first);
      setHistory((h) => [...h, first]);
      setPlacingId(null);
      setTextSelectedId(null);
      setTextEditor((e) => ({ ...e, active: false, id: null }));
      return rest;
    });
  }, []);

  // -------- Keyboard: delete selected text (when not editing) --------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        tool === "text" &&
        textSelectedId &&
        !textEditor.active
      ) {
        setShapes((prev) => {
          const next = prev.filter((s) => s.id !== textSelectedId);
          commitHistory(next);
          return next;
        });
        setTextSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, textSelectedId, textEditor.active, commitHistory, undo, redo]);

  // -------- Import background image --------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onPickImage = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        setBgHTMLImage(img);
        const imgShape: ImageShape = {
          id: uid("img"),
          type: "image",
          x: 0,
          y: 0,
          width: Math.min(img.width, stageSize.w),
          height: Math.min(img.height, stageSize.h),
          src: dataUrl,
          draggable: false,
        };
        setBgImage(imgShape);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // -------- Clear --------
  const clearCanvas = () => {
    const next: AnyShape[] = [];
    setShapes(next);
    setPlacingId(null);
    setTextSelectedId(null);
    setTextEditor({
      active: false,
      id: null,
      value: "",
      x: 0,
      y: 0,
      width: 200,
      fontSize: 20,
      fill: color,
    });
    setBgImage(null);
    setBgHTMLImage(null);
    commitHistory(next);
  };

  const canUndo = history.length > 1;
  const canRedo = redoStack.length > 0;

  // -------- Inline textarea events --------
  const onTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTextEditor((prev) => ({ ...prev, value }));
    if (textEditor.active && textEditor.id) {
      setShapes((prev) =>
        prev.map((s) =>
          s.id === textEditor.id ? ({ ...s, text: value } as AnyShape) : s
        )
      );
    }
  };

  const onTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      closeInlineEditor(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeInlineEditor(false);
    }
  };

  // Prevent committing when blur is caused by transformer interaction
  const onTextareaBlur = () => {
    if (transformClickRef.current || isTransformingRef.current) {
      // keep editing
      requestAnimationFrame(() => textareaRef.current?.focus());
      return;
    }
    closeInlineEditor(true);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: 10,
          gap: 8,
          borderBottom: "1px solid #e5e7eb",
          background: "#fafafa",
          flexWrap: "wrap",
          minHeight: 56,
        }}
      >
        <ToolbarButton
          onClick={() => setTool("pen")}
          style={{ background: tool === "pen" ? "#eef2ff" : "#fff" }}
        >
          Pen
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setTool("eraser")}
          style={{ background: tool === "eraser" ? "#eef2ff" : "#fff" }}
        >
          Eraser
        </ToolbarButton>

        {/* Shape tool + dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
          <ToolbarButton
            onClick={() => setTool("shape")}
            style={{ background: tool === "shape" ? "#eef2ff" : "#fff" }}
          >
            Shape
          </ToolbarButton>
          <select
            value={shapeKind}
            onChange={(ev) => setShapeKind(ev.target.value as ShapeKind)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <option value="rect">Rectangle</option>
            <option value="ellipse">Ellipse</option>
          </select>
        </div>

        <ToolbarButton
          onClick={() => setTool("text")}
          style={{ background: tool === "text" ? "#eef2ff" : "#fff" }}
        >
          Text
        </ToolbarButton>

        <Separator />

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Color
          <input type="color" value={color} onChange={(ev) => setColor(ev.target.value)} />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Width
          <input
            type="range"
            min={1}
            max={24}
            value={strokeWidth}
            onChange={(ev) => setStrokeWidth(parseInt(ev.target.value, 10))}
          />
          <span style={{ minWidth: 18, textAlign: "right" }}>{strokeWidth}</span>
        </label>

        <Separator />

        <ToolbarButton onClick={undo} disabled={!canUndo}>
          Undo
        </ToolbarButton>
        <ToolbarButton onClick={redo} disabled={!canRedo}>
          Redo
        </ToolbarButton>
        <ToolbarButton onClick={clearCanvas}>Clear</ToolbarButton>

        <Separator />

        <ToolbarButton onClick={onPickImage}>Import Image</ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        <Separator />

        <ToolbarButton onClick={exportPNGDownload}>Export PNG</ToolbarButton>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Stage
          ref={stageRef}
          width={stageSize.w}
          height={stageSize.h}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ background: "#ffffff" }}
        >
          {/* background layer */}
          <Layer listening={false}>
            <Rect x={0} y={0} width={stageSize.w} height={stageSize.h} fill="#ffffff" />
          </Layer>

          {/* Grid layer */}
          <Layer listening={false}>
            {gridLines.map((gl) => (
              <Line key={gl.id} points={gl.points} stroke={gl.color} strokeWidth={gl.strokeWidth} />
            ))}
          </Layer>

          {/* Background image */}
          {bgImage && bgHTMLImage && (
            <Layer>
              <KImage
                id={bgImage.id}
                image={bgHTMLImage}
                x={bgImage.x}
                y={bgImage.y}
                width={bgImage.width}
                height={bgImage.height}
                draggable={false}
              />
            </Layer>
          )}

          {/* Main drawing layer */}
          <Layer>
            {shapes.map((s) => {
              if (s.type === "line") {
                const ln = s as LineShape;
                return (
                  <Line
                    id={ln.id}
                    key={ln.id}
                    points={ln.points}
                    stroke={ln.erasing ? "#000" : ln.color}
                    strokeWidth={ln.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={ln.erasing ? "destination-out" : "source-over"}
                    listening
                    hitStrokeWidth={Math.max(20, ln.strokeWidth)}
                  />
                );
              }
              if (s.type === "rect") {
                const r = s as RectShape;
                const x = r.width < 0 ? r.x + r.width : r.x;
                const y = r.height < 0 ? r.y + r.height : r.y;
                const w = Math.abs(r.width);
                const h = Math.abs(r.height);
                const isActive = placingId === r.id; // only during placement
                return (
                  <Rect
                    id={r.id}
                    key={r.id}
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    stroke={r.stroke}
                    strokeWidth={r.strokeWidth}
                    draggable={isActive}
                    onDragEnd={(ev) => {
                      if (!isActive) return;
                      const node = ev.target as Konva.Rect;
                      updateShape(r.id, { x: node.x(), y: node.y() }, true);
                    }}
                    onTransformEnd={(ev) => {
                      if (!isActive) return;
                      const node = ev.target as Konva.Rect;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateShape(
                        r.id,
                        {
                          x: node.x(),
                          y: node.y(),
                          width: Math.max(1, node.width() * scaleX),
                          height: Math.max(1, node.height() * scaleY),
                        },
                        true
                      );
                    }}
                  />
                );
              }
              if (s.type === "ellipse") {
                const el = s as EllipseShape;
                const isActive = placingId === el.id; // only during placement
                return (
                  <Ellipse
                    id={el.id}
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    radiusX={Math.max(1, Math.abs(el.radiusX))}
                    radiusY={Math.max(1, Math.abs(el.radiusY))}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    draggable={isActive}
                    onDragEnd={(ev) => {
                      if (!isActive) return;
                      const node = ev.target as Konva.Ellipse;
                      updateShape(el.id, { x: node.x(), y: node.y() }, true);
                    }}
                    onTransformEnd={(ev) => {
                      if (!isActive) return;
                      const node = ev.target as Konva.Ellipse;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateShape(
                        el.id,
                        {
                          x: node.x(),
                          y: node.y(),
                          radiusX: Math.max(1, el.radiusX * scaleX),
                          radiusY: Math.max(1, el.radiusY * scaleY),
                        },
                        true
                      );
                    }}
                  />
                );
              }
              if (s.type === "text") {
                const t = s as TextShape;
                const isEditingThis = textEditor.active && textEditor.id === t.id;
                const isSelectedForResize =
                  tool === "text" && textSelectedId === t.id && !textEditor.active;

                // Enable drag when editing or selected for resize
                const draggableNow = isEditingThis || isSelectedForResize;

                return (
                  <KText
                    id={t.id}
                    key={t.id}
                    x={t.x}
                    y={t.y}
                    text={t.text}
                    fontSize={t.fontSize}
                    fill={t.fill}
                    width={t.width}
                    draggable={draggableNow}
                    onClick={() => {
                      if (tool === "text") openInlineEditor(t.id); 
                    }}
                    onDragMove={(ev) => {
                      // live sync editor pos while dragging
                      const node = ev.target as Konva.Text;
                      updateShape(t.id, { x: node.x(), y: node.y() });
                      if (isEditingThis && containerRef.current) {
                        const rect = containerRef.current.getBoundingClientRect();
                        setTextEditor((prev) => ({ ...prev, x: rect.left + node.x(), y: rect.top + node.y() }));
                      }
                    }}
                    onDragEnd={(ev) => {
                      const node = ev.target as Konva.Text;
                      updateShape(t.id, { x: node.x(), y: node.y() }, true);
                    }}
                    onTransformStart={() => {
                      isTransformingRef.current = true;
                    }}
                    onTransform={(ev) => {
                      const node = ev.target as Konva.Text;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      const newWidth = Math.max(20, (t.width ?? node.width()) * scaleX);
                      const newFont = Math.max(8, t.fontSize * scaleY);
                      node.scaleX(1);
                      node.scaleY(1);

                      updateShape(t.id, {
                        x: node.x(),
                        y: node.y(),
                        width: newWidth,
                        fontSize: newFont,
                      });

                      if (isEditingThis && containerRef.current) {
                        const rect = containerRef.current.getBoundingClientRect();
                        setTextEditor((prev) => ({
                          ...prev,
                          x: rect.left + node.x(),
                          y: rect.top + node.y(),
                          width: newWidth,
                          fontSize: newFont,
                        }));
                      }
                    }}
                    onTransformEnd={(ev) => {
                      const node = ev.target as Konva.Text;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      const currentWidth = t.width ?? node.width();
                      const newWidth = Math.max(20, currentWidth * scaleX);
                      const newFont = Math.max(8, t.fontSize * scaleY);
                      updateShape(
                        t.id,
                        { x: node.x(), y: node.y(), width: newWidth, fontSize: newFont },
                        true
                      );
                      isTransformingRef.current = false;
                      // keep focus if we were editing
                      if (isEditingThis) requestAnimationFrame(() => textareaRef.current?.focus());
                    }}
                  />
                );
              }
              return null;
            })}

            {/* Transformer: for placing shape or (editing/selected) text */}
            <Transformer
              ref={trRef}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              anchorSize={8}
              borderDash={[4, 4]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          </Layer>
        </Stage>

        {/* Invisible text editor overlay (captures keyboard input only) */}
        {textEditor.active && (
          <textarea
            ref={textareaRef}
            value={textEditor.value}
            onChange={onTextInput}
            onKeyDown={onTextKeyDown}
            onBlur={onTextareaBlur}
            style={{
              position: "fixed",
              left: textEditor.x,
              top: textEditor.y,
              width: textEditor.width,
              minHeight: Math.max(24, textEditor.fontSize + 8),
              fontSize: textEditor.fontSize,
              lineHeight: 1.2,
              fontFamily: "inherit",
              color: textEditor.fill,
              // Make it invisible but focused:
              opacity: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: 0,
              resize: "none",
              zIndex: 1000,
              whiteSpace: "pre-wrap",
              overflow: "hidden",
              // Let mouse go through so you can use transformer while editing:
              pointerEvents: "none",
              caretColor: "transparent",
            }}
          />
        )}
      </div>
    </div>
  );
});

export default Drawing;
