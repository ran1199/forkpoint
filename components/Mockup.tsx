// A live mockup of one screen, drawn under an option card (Ran's request).
// Wireframe only: greys, no brand colors or fonts, in both the demo and the live version.

import type { Mockup as MockupSpec, MockupElement } from "@/lib/types";

type Theme = {
  frame: string; screen: string; ink: string; ink2: string; surface: string; line: string;
  primary: string; secondary: string; chip: string; chipOn: string; toast: string; tabOn: string;
};

const t: Theme = {
  frame: "bg-zinc-400", screen: "bg-zinc-50", ink: "text-zinc-900", ink2: "text-zinc-600",
  surface: "bg-white", line: "border-zinc-300", primary: "bg-zinc-800 text-white",
  secondary: "bg-zinc-200 text-zinc-900", chip: "bg-zinc-200 text-zinc-900",
  chipOn: "bg-zinc-800 text-white", toast: "bg-zinc-800 text-white", tabOn: "text-zinc-900 font-semibold",
};

// Confidence levels (e.g. Ladle's F8) as filled grey dots: a badge whose detail is
// "confirmed", "good" or "rough" shows 3, 2 or 1 filled dots before its label.
const CONFIDENCE_DOTS: Record<string, number> = { confirmed: 3, good: 2, rough: 1 };

/** A badge right after a card is drawn inside that card (as on Ladle's recipe cards). */
function Stack({ items }: { items: MockupElement[] }) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < items.length; i++) {
    const el = items[i];
    const next = items[i + 1];
    if (el.kind === "card" && next?.kind === "badge") {
      out.push(<Element key={i} el={el} inner={next} />);
      i++;
    } else {
      out.push(<Element key={i} el={el} />);
    }
  }
  return <>{out}</>;
}

function list(text: string) {
  return text.split(",").map((t) => t.trim()).filter(Boolean);
}

function Element({ el, inner }: { el: MockupElement; inner?: MockupElement }) {
  switch (el.kind) {
    case "heading":
      return (
        <div>
          <p className={`text-[15px] font-semibold leading-tight ${t.ink}`}>{el.text}</p>
          {el.detail && <p className={`mt-0.5 text-[9px] ${t.ink2}`}>{el.detail}</p>}
        </div>
      );
    case "text":
      return <p className={`text-[9px] leading-snug ${t.ink2}`}>{el.text}</p>;
    case "number":
      return (
        <div className={`rounded-[10px] ${t.surface} px-2.5 py-2`}>
          <p className={`text-[18px] font-semibold leading-none ${t.ink}`}>{el.text}</p>
          {el.detail && <p className={`mt-1 text-[8px] ${t.ink2}`}>{el.detail}</p>}
        </div>
      );
    case "card":
      return (
        <div className={`rounded-[10px] ${t.surface} px-2.5 py-2`}>
          <p className={`text-[10px] font-semibold leading-tight ${t.ink}`}>{el.text}</p>
          {el.detail && <p className={`mt-0.5 text-[8px] leading-snug ${t.ink2}`}>{el.detail}</p>}
          {inner && <div className="mt-1"><Element el={inner} /></div>}
        </div>
      );
    case "list_item":
      return (
        <div className={`flex items-baseline justify-between gap-2 border-b ${t.line} pb-1`}>
          <span className={`min-w-0 text-[9px] leading-snug ${t.ink}`}>{el.text}</span>
          <span className={`shrink-0 text-[9px] font-semibold ${t.ink}`}>{el.detail}</span>
        </div>
      );
    case "button":
    case "secondary_button":
      return (
        <div className={`rounded-[7px] px-2 py-1.5 text-center text-[9px] font-semibold ${el.kind === "button" ? t.primary : t.secondary}`}>
          {el.text}
        </div>
      );
    case "chips":
      return (
        <div className="flex flex-wrap gap-1">
          {list(el.text).map((c) => (
            <span key={c} className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${c === el.detail.trim() ? t.chipOn : t.chip}`}>{c}</span>
          ))}
        </div>
      );
    case "input":
      return (
        <div>
          {el.detail && <p className={`mb-0.5 text-[8px] font-medium ${t.ink2}`}>{el.detail}</p>}
          <div className={`rounded-[7px] border ${t.line} ${t.surface} px-2 py-1.5 text-[9px] ${t.ink2}`}>{el.text}</div>
        </div>
      );
    case "image":
      return (
        <div className={`flex h-14 items-center justify-center rounded-[8px] border border-dashed ${t.line} text-[8px] ${t.ink2}`}>
          {el.text}
        </div>
      );
    case "badge": {
      const dots = CONFIDENCE_DOTS[el.detail.trim()];
      if (dots) {
        return (
          <p className={`flex items-center gap-1 text-[8px] font-medium ${t.ink2}`}>
            <span className="flex gap-[2px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-[5px] w-[5px] rounded-full ${i < dots ? "bg-zinc-600" : "bg-zinc-300"}`} />
              ))}
            </span>
            {el.text}
          </p>
        );
      }
      return <span className={`self-start rounded-full px-2 py-0.5 text-[8px] font-medium ${t.secondary}`}>{el.text}</span>;
    }
    case "tabs":
      return null; // drawn at the bottom of the screen
  }
}

export function MockupPhone({ mockup, label }: { mockup: MockupSpec; label: string }) {
  const screen = mockup.elements.filter((e) => e.layer === "screen" && e.kind !== "tabs");
  const sheet = mockup.elements.filter((e) => e.layer === "sheet");
  const toast = mockup.elements.filter((e) => e.layer === "toast");
  const tabs = mockup.elements.find((e) => e.kind === "tabs");

  return (
    <figure className="flex flex-col items-center">
      {/* The phone is a picture of the option: one label for screen readers, details hidden. */}
      <div
        role="img"
        aria-label={`${label}: mockup of the ${mockup.screen || "screen"}`}
        className={`w-full max-w-[200px] rounded-[22px] p-[5px] ${t.frame}`}
      >
        <div
          aria-hidden="true"
          className={`relative flex h-[340px] flex-col overflow-hidden rounded-[18px] ${t.screen}`}
        >
          <div className={`flex justify-between px-3 pt-1.5 text-[7px] font-semibold ${t.ink}`}>
            <span>9:41</span>
            <span className={`h-[9px] w-[44px] rounded-full ${t.frame}`} />
            <span>●●●</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-2.5 pt-2">
            <Stack items={screen} />
          </div>
          {tabs && (
            <div className={`flex justify-around border-t ${t.line} ${t.surface} px-1 py-1.5 text-[7px] ${t.ink2}`}>
              {list(tabs.text).map((tab) =>
                tab === "📷" ? (
                  // A round camera button in the middle of the tab bar (as in the Ladle prototype).
                  <span key={tab} className="-mt-3 h-6 w-6 rounded-full border-2 border-white bg-zinc-400" />
                ) : (
                  <span key={tab} className={tab === tabs.detail.trim() ? t.tabOn : ""}>{tab}</span>
                ),
              )}
            </div>
          )}
          {sheet.length > 0 && (
            <div className="absolute inset-0 flex flex-col justify-end bg-black/25">
              <div className={`flex flex-col gap-1.5 rounded-t-[14px] bg-white px-2.5 pb-3 pt-2`}>
                <span className={`mx-auto mb-0.5 h-[3px] w-6 rounded-full bg-zinc-300`} />
                <Stack items={sheet} />
              </div>
            </div>
          )}
          {toast.length > 0 && (
            <div className={`absolute inset-x-2 ${tabs ? "bottom-9" : "bottom-3"} flex items-center justify-between gap-2 rounded-[8px] px-2 py-1.5 ${t.toast}`}>
              <span className="text-[8px]">{toast[0].text}</span>
              {toast[0].detail && <span className="shrink-0 text-[8px] font-semibold">{toast[0].detail}</span>}
            </div>
          )}
        </div>
      </div>
      {mockup.screen && <figcaption className="mt-1.5 text-xs text-zinc-600">{mockup.screen}</figcaption>}
    </figure>
  );
}
