import { QuickCalculator } from "../tools/QuickCalculator";

export function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Waterproofing tools</h1>
        <p className="text-white/60 mt-1">
          Start free — get an instant cost band. Verify your mobile once to unlock the exact price.
        </p>
      </div>
      <QuickCalculator />
    </div>
  );
}
