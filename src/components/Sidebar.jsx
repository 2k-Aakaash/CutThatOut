import {
  MousePointer,
  Wand2,
  Paintbrush,
  Activity,
  History,
  Settings,
  Brush
} from "lucide-react";

export default function Sidebar({ activeTool, setActiveTool, sidebarOpen, setSidebarOpen }) {
  const tools = [
    { id: "select", icon: MousePointer, label: "Select Tool (V)" },
    { id: "remove", icon: Wand2, label: "Magic Wand (W) - Remove BG" },
    { id: "paint", icon: Paintbrush, label: "Paint Bucket (G) - Backdrops" },
    { id: "brush", icon: Brush, label: "Brush Tool (B) - Touch Ups" },
    { id: "diagnostics", icon: Activity, label: "Performance Specs (P)" },
    { id: "history", icon: History, label: "Export History (H)" },
    { id: "settings", icon: Settings, label: "Engine Settings (S)" },
  ];

  return (
    <>
      {/* Mobile Toolbar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Toolbar Container */}
      <aside
        className={`
          fixed md:relative top-14 md:top-0 bottom-0 left-0 z-40 w-[60px] border-r border-border bg-card flex flex-col items-center py-4 justify-between shrink-0 transition-transform duration-300 md:translate-x-0 lg:bg-card/40 lg:backdrop-blur-md
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
      >
      {/* Upper Toolbar Tools */}
      <div className="flex flex-col gap-2 w-full px-2">
        {tools.slice(0, 4).map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`
                group relative flex items-center justify-center size-10 rounded-lg transition duration-200 outline-none
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              `}
              title={tool.label}
            >
              <Icon className="size-4.5" />
              {/* Floating Tooltip */}
              <span className="absolute left-[70px] scale-0 group-hover:scale-100 transition duration-150 origin-left bg-popover text-popover-foreground text-xs font-semibold px-2 py-1 rounded shadow-lg border border-border pointer-events-none whitespace-nowrap z-50">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lower System Tools */}
      <div className="flex flex-col gap-2 w-full px-2">
        <div className="h-px bg-border my-2 mx-1" />
        {tools.slice(4).map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`
                group relative flex items-center justify-center size-10 rounded-lg transition duration-200 outline-none
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              `}
              title={tool.label}
            >
              <Icon className="size-4.5" />
              {/* Floating Tooltip */}
              <span className="absolute left-[70px] scale-0 group-hover:scale-100 transition duration-150 origin-left bg-popover text-popover-foreground text-xs font-semibold px-2 py-1 rounded shadow-lg border border-border pointer-events-none whitespace-nowrap z-50">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
    </>
  );
}
