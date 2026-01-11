import { PenTool, Armchair, Lightbulb, Plus } from "lucide-react";

export const QuickAddBar = () => {
  const quickActions = [
    { icon: PenTool, label: "References", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
    { icon: Armchair, label: "Products", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30" },
    { icon: Lightbulb, label: "Lighting", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30" }
  ];

  return (
    <div className="px-6 py-3 border-t border-white/10 bg-black/20">
      <div className="flex items-center justify-center gap-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${action.color} border backdrop-blur-sm hover:scale-105 transition-transform`}
          >
            <action.icon className="w-4 h-4 text-white/80" />
            <span className="text-sm font-medium text-white/90">{action.label}</span>
            <Plus className="w-3.5 h-3.5 text-white/60" />
          </button>
        ))}
      </div>
    </div>
  );
};
