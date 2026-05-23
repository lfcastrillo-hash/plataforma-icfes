export default function ChatIA() {
  return (
    <button
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        border: "none",
        background: "#3d8bfd",
        color: "white",
        cursor: "pointer",
      }}
      onClick={() => alert("Asistente IA próximamente")}
    >
      IA
    </button>
  );
}
