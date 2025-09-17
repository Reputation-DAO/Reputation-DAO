// src/hooks/useCid.ts
import { useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";

export function useCid() {
  const { cid } = useParams<{ cid: string }>();
  if (!cid) throw new Error("Missing :cid param");
  // Validate early; throws if bad:
  Principal.fromText(cid);
  return cid;
}
