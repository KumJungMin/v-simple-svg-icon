import { useEffect, useRef, useState } from "react";
import { Sample1Icon, sample1Meta } from "@v-simple/icon/common";
import { drawIconToCanvas } from "@v-simple/icon/core/drawIconToCanvas";

function getCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderCanvasIcon(
  canvas: HTMLCanvasElement | null,
  isVisible: boolean,
  color: string
) {
  if (!isVisible || !canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, 64, 64);
  drawIconToCanvas(ctx, sample1Meta, {
    stroke: color,
    size: 50,
  });
}

export default function App() {
  const [showIconOne, setShowIconOne] = useState(true);
  const [showIconTwo, setShowIconTwo] = useState(true);
  const [showCanvasOne, setShowCanvasOne] = useState(true);
  const [showCanvasTwo, setShowCanvasTwo] = useState(true);
  const [isRed, setIsRed] = useState(true);

  const canvasOneRef = useRef<HTMLCanvasElement | null>(null);
  const canvasTwoRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--icon-color", isRed ? "red" : "blue");

    const color = getCssVar("--icon-color");
    renderCanvasIcon(canvasOneRef.current, showCanvasOne, color);
    renderCanvasIcon(canvasTwoRef.current, showCanvasTwo, color);
  }, [isRed, showCanvasOne, showCanvasTwo]);

  return (
    <div className="page">
      <main className="panel">
        <header className="hero">
          <p className="eyebrow">React Migration</p>
          <h1>@v-simple/icon</h1>
          <p className="hero-copy">
            아이콘 컴포넌트와 캔버스 렌더링 예제를 React 기준으로 다시 구성했습니다.
          </p>
        </header>

        <section className="section">
          <div className="section-heading">
            <h2>Component 방식</h2>
            <p>생성된 아이콘 컴포넌트를 JSX에서 바로 렌더링합니다.</p>
          </div>

          <div className="controls">
            <button type="button" onClick={() => setShowIconOne((value) => !value)}>
              아이콘 토글 1
            </button>
            <button type="button" onClick={() => setShowIconTwo((value) => !value)}>
              아이콘 토글 2
            </button>
          </div>

          <div className="preview-row">
            {showIconOne ? <Sample1Icon width={50} height={50} color="red" /> : null}
            {showIconTwo ? <Sample1Icon width={50} height={50} color="blue" /> : null}
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <h2>Canvas 방식</h2>
            <p>같은 메타 데이터를 사용해 Canvas에도 그릴 수 있습니다.</p>
          </div>

          <div className="controls">
            <button type="button" onClick={() => setShowCanvasOne((value) => !value)}>
              캔버스 토글 1
            </button>
            <button type="button" onClick={() => setShowCanvasTwo((value) => !value)}>
              캔버스 토글 2
            </button>
            <button type="button" onClick={() => setIsRed((value) => !value)}>
              CSS 변수 색상 변경
            </button>
          </div>

          <div className="preview-row">
            {showCanvasOne ? (
              <div className="canvas-frame">
                <canvas ref={canvasOneRef} width="64" height="64" />
              </div>
            ) : null}
            {showCanvasTwo ? (
              <div className="canvas-frame">
                <canvas ref={canvasTwoRef} width="64" height="64" />
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
