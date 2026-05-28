export default function Upload({ setImage }) {
  return (
    <div className="p-4 border rounded-xl bg-card">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />
    </div>
  );
}
