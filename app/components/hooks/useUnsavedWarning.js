import { useEffect } from "react";

export default function useUnsavedChangesWarning(shouldWarn) {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!shouldWarn) return;
      e.preventDefault();
      // Modern browsers ignore custom text; must set returnValue for legacy support.
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldWarn]);
}
