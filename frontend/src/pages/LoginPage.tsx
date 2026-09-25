import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/employees");
    } catch {
      setError("Unable to sign in. Check your email and password.");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "grey.100",
      }}
    >
      <Paper
        component="form"
        onSubmit={submit}
        sx={{ p: 4, width: 400, display: "grid", gap: 2 }}
      >
        <Typography variant="h5">HR Manager sign in</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          slotProps={{ htmlInput: { "aria-label": "Email" } }}
        />
        <TextField
          label="Password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          slotProps={{ htmlInput: { "aria-label": "Password" } }}
        />
        <Button type="submit" variant="contained">
          Sign in
        </Button>
      </Paper>
    </Box>
  );
}
