import { useEffect, useRef } from 'react';

export default function Canvas({ isDrawer, socket, roomId }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const ctx = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    ctx.current = canvas.getContext('2d');
    
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    socket.on('draw', drawLine);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('draw');
    };
  }, []);

  const startDrawing = (e) => {
    if (!isDrawer) return;
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    ctx.current.beginPath();
  };

  const draw = (e) => {
    if (!isDrawing.current || !isDrawer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.current.lineTo(x, y);
    ctx.current.stroke();
    ctx.current.beginPath();
    ctx.current.moveTo(x, y);

    socket.emit('draw', roomId, { x, y });
  };

  const drawLine = ({ x, y }) => {
    ctx.current.lineTo(x, y);
    ctx.current.stroke();
    ctx.current.beginPath();
    ctx.current.moveTo(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[600px] border border-gray-300 rounded cursor-crosshair"
      onMouseDown={startDrawing}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onMouseMove={draw}
    />
  );
}