import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import {
  makeFactoriaWithPlug,
  getFactoriaCanisterId,
} from "../components/canister/factoria";

/* ---------------------------------------------------------
   Styled
--------------------------------------------------------- */
const PageWrap = styled(Box)({
  minHeight: "100vh",
  backgroundColor: "hsl(var(--background))",
});

const Shell = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 1200,
  margin: "0 auto",
  padding: theme.spacing(3.5),
  borderRadius: "var(--radius)",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  boxShadow: "var(--shadow-lg)",
}));

const ActionBtn = styled(Button)({
  borderRadius: "var(--radius)",
  textTransform: "none",
  fontWeight: 700,
});

/* ---------------------------------------------------------
   Types + helpers
--------------------------------------------------------- */
type Plan = "Free" | "Basic" | "Pro";
type Status = "Active" | "Archived";

type OrgRecord = {
  id: string;
  name: string;
  canisterId: string;
  plan?: Plan;
  status: Status;
  publicVisibility?: boolean;
  createdAt?: number;
  users?: string;
  cycles?: string;
  txCount?: string;
  paused?: boolean;
  isStopped?: boolean;
};

const toStatus = (s: any): Status =>
  s && typeof s === "object" && "Archived" in s ? "Archived" : "Active";

const natToStr = (n?: bigint) =>
  typeof n === "bigint" ? n.toString() : undefined;

/* ---------------------------------------------------------
   Component
--------------------------------------------------------- */
const OrgSelector: React.FC = () => {
  const navigate = useNavigate();

  // wallet + factoria
  const [principal, setPrincipal] = useState<string | null>(null);
  const [factoria, setFactoria] =
    useState<Awaited<ReturnType<typeof makeFactoriaWithPlug>> | null>(null);

  // data + ui state
  const [orgs, setOrgs] = useState<OrgRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);

  // dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [createNote, setCreateNote] = useState("");
  const [createCycles, setCreateCycles] = useState("0");
  const [createPlan, setCreatePlan] = useState<Plan>("Free");
  const [createPublic, setCreatePublic] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrgRecord | null>(null);
  const [editPlan, setEditPlan] = useState<Plan>("Free");
  const [editPublic, setEditPublic] = useState<boolean>(true);

  const [delOpen, setDelOpen] = useState(false);
  const [delOrg, setDelOrg] = useState<OrgRecord | null>(null);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpOrg, setTopUpOrg] = useState<OrgRecord | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("0");

  const clearToasts = () => {
    setErr(null);
    setOk(null);
  };

  /* -----------------------------------------
     Connect Plug + build Factoria actor
  ----------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        setConnecting(true);
        const actor = await makeFactoriaWithPlug({
          host: "https://icp-api.io",
          canisterId: getFactoriaCanisterId(),
        });
        const p = await (window.ic?.plug as any)?.getPrincipal?.();
        if (!p) throw new Error("Plug principal unavailable. Unlock Plug.");
        setPrincipal(p.toString());
        setFactoria(actor);
      } catch (e: any) {
        setErr(e?.message || "Failed to connect Plug / Factoria.");
      } finally {
        setConnecting(false);
      }
    })();
  }, []);

  /* -----------------------------------------
     Fetch orgs
  ----------------------------------------- */
  const fetchOrgs = async () => {
    if (!factoria || !principal) return;
    setLoading(true);
    clearToasts();
    try {
      const owner = Principal.fromText(principal);
      const children: Principal[] = await factoria.listByOwner(owner);

      const rows: OrgRecord[] = [];
      for (const child of children) {
        const childIdText = child.toText();

        const c = await factoria.getChild(child);
        if (!Array.isArray(c) || !c.length) continue;
        const rec = c[0];

        let users, cycles, txCount, paused;
        let isStopped = false;
        try {
          const h = await factoria.childHealth(child);
          if (Array.isArray(h) && h.length) {
            users = natToStr(h[0].users);
            cycles = natToStr(h[0].cycles);
            txCount = natToStr(h[0].txCount);
            paused = Boolean(h[0].paused);
          } else {
            isStopped = true;
          }
        } catch {
          isStopped = true;
        }

        rows.push({
          id: childIdText,
          name: rec.note?.trim?.() ? rec.note : childIdText,
          canisterId: childIdText,
          status: toStatus(rec.status),
          createdAt: Number(rec.created_at || 0),
          users,
          cycles,
          txCount,
          paused,
          plan: "Free",
          publicVisibility: true,
          isStopped,
        });
      }
      setOrgs(rows);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch organizations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
    // eslint-disable-next-line
  }, [factoria, principal]);

  /* -----------------------------------------
     Toggle Start/Stop
  ----------------------------------------- */
  const togglePower = async (o: OrgRecord) => {
    if (!factoria) return;
    clearToasts();
    try {
      const id = Principal.fromText(o.canisterId);
      if (o.isStopped || o.status === "Archived") {
        await factoria.startChild(id);
        setOk("Canister started.");
      } else {
        await factoria.stopChild(id);
        setOk("Canister stopped.");
      }
      await fetchOrgs();
    } catch (e: any) {
      setErr(e?.message || "Toggle failed.");
    }
  };

  /* -----------------------------------------
     Other actions (create, update, delete, topup)
  ----------------------------------------- */
  const createOrg = async () => {
    if (!factoria || !principal) return;
    clearToasts();
    try {
      const owner = Principal.fromText(principal);
      const cycles = BigInt(createCycles || "0");
      const awarders: Principal[] = [];
      const newId = await factoria.createOrReuseChildFor(
        owner,
        cycles,
        awarders,
        createNote.trim()
      );
      setOk(`Organization created: ${newId.toText()}`);
      setCreateOpen(false);
      setCreateNote("");
      setCreateCycles("0");
      await fetchOrgs();
    } catch (e: any) {
      setErr(e?.message || "Create failed.");
    }
  };

  const updateOrg = async () => {
    clearToasts();
    if (!editOrg) return;
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === editOrg.id
          ? { ...o, plan: editPlan, publicVisibility: editPublic }
          : o
      )
    );
    setOk(`Saved local settings for ${editOrg.name}.`);
    setEditOpen(false);
    setEditOrg(null);
  };

  const deleteOrg = async () => {
    if (!factoria || !delOrg) return;
    clearToasts();
    try {
      const id = Principal.fromText(delOrg.canisterId);
      try {
        await factoria.archiveChild(id);
      } catch {
        await factoria.deleteChild(id);
      }
      setOk(`Removed ${delOrg.name}.`);
      setDelOpen(false);
      setDelOrg(null);
      await fetchOrgs();
    } catch (e: any) {
      setErr(e?.message || "Delete failed.");
    }
  };

  const topUp = async () => {
    if (!factoria || !topUpOrg) return;
    clearToasts();
    try {
      const amt = BigInt(topUpAmount || "0");
      const res = await factoria.topUpChild(
        Principal.fromText(topUpOrg.canisterId),
        amt
      );
      if ("ok" in res) setOk(`Top up OK: +${res.ok.toString()} cycles`);
      else setErr(res.err);
      setTopUpOpen(false);
      setTopUpOrg(null);
      setTopUpAmount("0");
      await fetchOrgs();
    } catch (e: any) {
      setErr(e?.message || "Top up failed.");
    }
  };

  /* -----------------------------------------
     Render
  ----------------------------------------- */
  const hasData = useMemo(() => orgs.length > 0, [orgs.length]);

  if (connecting) {
    return (
      <PageWrap display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </PageWrap>
    );
  }

  if (!principal) {
    return (
      <PageWrap display="flex" alignItems="center" justifyContent="center" px={2}>
        <Shell sx={{ maxWidth: 560 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: "hsl(var(--primary))", mb: 1 }}>
            Connect Your Wallet
          </Typography>
          <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))", mb: 2 }}>
            Please connect your Plug wallet to manage organizations.
          </Typography>
          <ActionBtn
            variant="contained"
            onClick={() => window.open("https://plugwallet.ooo/", "_blank")}
            sx={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Install Plug
          </ActionBtn>
          {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
        </Shell>
      </PageWrap>
    );
  }

  return (
    <PageWrap px={2} py={4}>
      <Shell>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight={800}>Organization Manager</Typography>
          <Box display="flex" gap={1.5}>
            <ActionBtn variant="outlined" onClick={() => setCreateOpen(true)}>
              Create New
            </ActionBtn>
          </Box>
        </Box>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}

        <Divider sx={{ mb: 3 }} />

        {/* Cards */}
        <Box mb={3}>
          <Typography variant="h6" fontWeight={700}>Existing Organizations</Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : hasData ? (
            <Grid container spacing={2}>
              {orgs.map((o) => (
                <Grid item xs={12} sm={6} md={3} key={o.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={700}>{o.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{o.id}</Typography>
                      <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                        <Chip size="small" label={o.plan || "Free"} />
                        <Chip size="small" color={o.status === "Archived" ? "default" : "success"} label={o.status} />
                        <Chip size="small" label={o.publicVisibility ? "Public" : "Private"} variant="outlined" />
                        {o.isStopped && <Chip size="small" label="Stopped" />}
                      </Box>
                      {o.cycles && <Typography variant="caption" display="block">Cycles: {o.cycles}</Typography>}
                      {o.users && <Typography variant="caption" display="block">Users: {o.users}</Typography>}
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => navigate("/dashboard")}>Manage</Button>
                      <Button size="small" onClick={() => { setTopUpOrg(o); setTopUpOpen(true); }}>Top Up</Button>
                      <Button size="small" onClick={() => togglePower(o)}>
                        {o.isStopped || o.status === "Archived" ? "Start" : "Stop"}
                      </Button>
                      <Button size="small" onClick={() => {
                        setEditOrg(o);
                        setEditPlan(o.plan || "Free");
                        setEditPublic(!!o.publicVisibility);
                        setEditOpen(true);
                      }}>
                        Edit
                      </Button>
                      <Button color="error" size="small" onClick={() => { setDelOrg(o); setDelOpen(true); }}>
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No organizations found.</Typography>
          )}
        </Box>

        {/* Table */}
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Canister ID</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Cycles</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orgs.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.name}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>{o.canisterId}</TableCell>
                  <TableCell>{o.plan || "Free"}</TableCell>
                  <TableCell>{o.cycles || "—"}</TableCell>
                  <TableCell>{o.status}{o.isStopped ? " (Stopped)" : ""}</TableCell>
                  <TableCell>{o.publicVisibility ? "Public" : "Private"}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate("/dashboard")}>Manage</Button>
                    <Button size="small" onClick={() => { setTopUpOrg(o); setTopUpOpen(true); }}>Top Up</Button>
                    <Button size="small" onClick={() => togglePower(o)}>
                      {o.isStopped || o.status === "Archived" ? "Start" : "Stop"}
                    </Button>
                    <Button size="small" onClick={() => {
                      setEditOrg(o);
                      setEditPlan(o.plan || "Free");
                      setEditPublic(!!o.publicVisibility);
                      setEditOpen(true);
                    }}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => { setDelOrg(o); setDelOpen(true); }}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Create dialog */}
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create New Organization (Factory Child)</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Organization Name / Note"
              placeholder="e.g., Tech Innovators Inc."
              value={createNote}
              onChange={(e) => setCreateNote(e.target.value)}
              sx={{ mt: 1.5, mb: 2 }}
            />
            <TextField
              fullWidth
              label="Initial Cycles (nat)"
              value={createCycles}
              onChange={(e) => setCreateCycles(e.target.value.replace(/[^\d]/g, ""))}
              helperText="Optional. 0 = none. Factory must have enough cycles to fund creation/top-up."
              sx={{ mb: 2 }}
            />
            <TextField
              select
              fullWidth
              label="Plan (UI only)"
              value={createPlan}
              onChange={(e) => setCreatePlan(e.target.value as Plan)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="Free">Free</MenuItem>
              <MenuItem value="Basic">Basic</MenuItem>
              <MenuItem value="Pro">Pro</MenuItem>
            </TextField>
            <FormControlLabel
              control={<Switch checked={createPublic} onChange={(e) => setCreatePublic(e.target.checked)} />}
              label="Public Visibility (UI only)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={createOrg}>Create</Button>
          </DialogActions>
        </Dialog>

        {/* Edit dialog (UI only) */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Organization (UI Fields)</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
              {editOrg?.name} — <span style={{ fontFamily: "ui-monospace, monospace" }}>{editOrg?.id}</span>
            </Typography>
            <TextField
              select
              fullWidth
              label="Plan"
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value as Plan)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="Free">Free</MenuItem>
              <MenuItem value="Basic">Basic</MenuItem>
              <MenuItem value="Pro">Pro</MenuItem>
            </TextField>
            <FormControlLabel
              control={<Switch checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} />}
              label="Public Visibility"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={updateOrg}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* Delete dialog */}
        <Dialog open={delOpen} onClose={() => setDelOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Remove Organization</DialogTitle>
          <DialogContent dividers>
            <Typography>
              Are you sure you want to remove{" "}
              <strong>{delOrg?.name || delOrg?.id}</strong>? We will try to archive first, then delete.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDelOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={deleteOrg}>Remove</Button>
          </DialogActions>
        </Dialog>

        {/* Top Up dialog */}
        <Dialog open={topUpOpen} onClose={() => setTopUpOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Top Up Cycles</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Target: <span style={{ fontFamily: "ui-monospace, monospace" }}>{topUpOrg?.id}</span>
            </Typography>
            <TextField
              fullWidth
              label="Amount (cycles, nat)"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value.replace(/[^\d]/g, ""))}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTopUpOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={topUp}>Top Up</Button>
          </DialogActions>
        </Dialog>
      </Shell>
    </PageWrap>
  );
};

export default OrgSelector;
