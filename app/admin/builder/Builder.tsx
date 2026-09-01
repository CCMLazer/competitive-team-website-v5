"use client";

import { useMemo, useState } from "react";

type ElementType = "text" | "heading" | "button" | "image" | "section";

type BuilderElement = {
  id: string;
  type: ElementType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  background: string;
  borderRadius: number;
  opacity: number;
};

const initialElements: BuilderElement[] = [
  {
    id: "hero-title",
    type: "heading",
    content: "YOUR TEAM",
    x: 80,
    y: 80,
    width: 500,
    height: 90,
    fontSize: 64,
    fontFamily: "Arial",
    color: "#ffffff",
    background: "transparent",
    borderRadius: 0,
    opacity: 1,
  },
  {
    id: "hero-tag",
    type: "text",
    content: "COMPETE WITHOUT EXCUSES.",
    x: 84,
    y: 180,
    width: 500,
    height: 50,
    fontSize: 24,
    fontFamily: "Arial",
    color: "#e8ff3f",
    background: "transparent",
    borderRadius: 0,
    opacity: 1,
  },
  {
    id: "hero-button",
    type: "button",
    content: "JOIN DISCORD",
    x: 84,
    y: 260,
    width: 180,
    height: 55,
    fontSize: 16,
    fontFamily: "Arial",
    color: "#0b0d10",
    background: "#e8ff3f",
    borderRadius: 10,
    opacity: 1,
  },
];

const fonts = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Courier New",
  "Impact",
];

export default function Builder() {
  const [elements, setElements] =
    useState<BuilderElement[]>(initialElements);

  const [selectedId, setSelectedId] = useState<string | null>(
    "hero-title"
  );

  const [mode, setMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  const selected = useMemo(
    () => elements.find((x) => x.id === selectedId) ?? null,
    [elements, selectedId]
  );

  function update(id: string, changes: Partial<BuilderElement>) {
    setElements((items) =>
      items.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

  function addElement(type: ElementType) {
    const id = crypto.randomUUID();

    const element: BuilderElement = {
      id,
      type,
      content:
        type === "heading"
          ? "New Heading"
          : type === "button"
          ? "BUTTON"
          : type === "image"
          ? "IMAGE"
          : type === "section"
          ? "SECTION"
          : "New text",
      x: 100,
      y: 100 + elements.length * 30,
      width:
        type === "button"
          ? 180
          : type === "section"
          ? 700
          : 500,
      height:
        type === "button"
          ? 55
          : type === "section"
          ? 200
          : 70,
      fontSize: type === "heading" ? 48 : 20,
      fontFamily: "Arial",
      color: "#ffffff",
      background:
        type === "button"
          ? "#e8ff3f"
          : type === "section"
          ? "#111419"
          : "transparent",
      borderRadius: 10,
      opacity: 1,
    };

    setElements((items) => [...items, element]);
    setSelectedId(id);
  }

  function removeSelected() {
    if (!selectedId) return;

    setElements((items) =>
      items.filter((item) => item.id !== selectedId)
    );

    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selected) return;

    const copy = {
      ...selected,
      id: crypto.randomUUID(),
      x: selected.x + 25,
      y: selected.y + 25,
    };

    setElements((items) => [...items, copy]);
    setSelectedId(copy.id);
  }

  return (
    <main className="v5Builder">
      <header className="builderTop">
        <div>
          <strong>TEAM BUILDER</strong>
          <span> V5</span>
        </div>

        <div className="deviceControls">
          <button
            className={mode === "desktop" ? "active" : ""}
            onClick={() => setMode("desktop")}
          >
            Desktop
          </button>

          <button
            className={mode === "tablet" ? "active" : ""}
            onClick={() => setMode("tablet")}
          >
            Tablet
          </button>

          <button
            className={mode === "mobile" ? "active" : ""}
            onClick={() => setMode("mobile")}
          >
            Mobile
          </button>
        </div>

        <div className="builderActions">
          <button>Undo</button>
          <button>Redo</button>
          <button className="save">Save</button>
          <button className="publish">Publish</button>
        </div>
      </header>

      <div className="builderLayout">
        <aside className="builderSidebar left">
          <h3>ADD</h3>

          <button onClick={() => addElement("heading")}>
            + Heading
          </button>

          <button onClick={() => addElement("text")}>
            + Text
          </button>

          <button onClick={() => addElement("button")}>
            + Button
          </button>

          <button onClick={() => addElement("image")}>
            + Image
          </button>

          <button onClick={() => addElement("section")}>
            + Section
          </button>

          <h3>LAYERS</h3>

          <div className="layers">
            {elements.map((element) => (
              <button
                key={element.id}
                className={
                  selectedId === element.id ? "selected" : ""
                }
                onClick={() => setSelectedId(element.id)}
              >
                {element.type}
                <span>{element.content}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="canvasArea">
          <div
            className={`websiteCanvas ${mode}`}
            onClick={() => setSelectedId(null)}
          >
            {elements.map((element) => {
              const isSelected = selectedId === element.id;

              return (
                <div
                  key={element.id}
                  className={`builderElement ${
                    isSelected ? "selectedElement" : ""
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(element.id);
                  }}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    color: element.color,
                    background: element.background,
                    borderRadius: element.borderRadius,
                    opacity: element.opacity,
                  }}
                >
                  {element.type === "image" ? (
                    <div className="imagePlaceholder">
                      IMAGE
                    </div>
                  ) : element.type === "button" ? (
                    <button>{element.content}</button>
                  ) : (
                    element.content
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="builderSidebar right">
          <h3>PROPERTIES</h3>

          {!selected && (
            <p className="emptyProperties">
              Select an element to edit it.
            </p>
          )}

          {selected && (
            <>
              <label>
                Content
                <input
                  value={selected.content}
                  onChange={(event) =>
                    update(selected.id, {
                      content: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Font
                <select
                  value={selected.fontFamily}
                  onChange={(event) =>
                    update(selected.id, {
                      fontFamily: event.target.value,
                    })
                  }
                >
                  {fonts.map((font) => (
                    <option key={font}>{font}</option>
                  ))}
                </select>
              </label>

              <label>
                Font size
                <input
                  type="number"
                  value={selected.fontSize}
                  onChange={(event) =>
                    update(selected.id, {
                      fontSize: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label>
                X position
                <input
                  type="number"
                  value={selected.x}
                  onChange={(event) =>
                    update(selected.id, {
                      x: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label>
                Y position
                <input
                  type="number"
                  value={selected.y}
                  onChange={(event) =>
                    update(selected.id, {
                      y: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label>
                Width
                <input
                  type="number"
                  value={selected.width}
                  onChange={(event) =>
                    update(selected.id, {
                      width: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label>
                Height
                <input
                  type="number"
                  value={selected.height}
                  onChange={(event) =>
                    update(selected.id, {
                      height: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label>
                Text color
                <input
                  type="color"
                  value={selected.color}
                  onChange={(event) =>
                    update(selected.id, {
                      color: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Background
                <input
                  type="color"
                  value={
                    selected.background === "transparent"
                      ? "#000000"
                      : selected.background
                  }
                  onChange={(event) =>
                    update(selected.id, {
                      background: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Border radius
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selected.borderRadius}
                  onChange={(event) =>
                    update(selected.id, {
                      borderRadius: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label>
                Opacity
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selected.opacity}
                  onChange={(event) =>
                    update(selected.id, {
                      opacity: Number(event.target.value),
                    })
                  }
                />
              </label>

              <div className="propertyActions">
                <button onClick={duplicateSelected}>
                  Duplicate
                </button>

                <button
                  className="danger"
                  onClick={removeSelected}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}