import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const drawerWidth = 248;

const navigation = [
  { label: "Overview", path: "/dashboard", icon: <DashboardRoundedIcon /> },
  { label: "Employees", path: "/employees", icon: <PeopleAltRoundedIcon /> },
];

function Brand() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          width: 36,
          height: 36,
          borderRadius: "10px",
          color: "#fff",
          background: "linear-gradient(135deg, #2563eb, #60a5fa)",
          fontWeight: 800,
          fontSize: 15,
          boxShadow: "0 6px 14px rgba(37, 99, 235, .28)",
        }}
      >
        A
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-.02em",
          }}
        >
          ACME
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,.52)",
            fontSize: 10,
            letterSpacing: ".14em",
            textTransform: "uppercase",
          }}
        >
          People ops
        </Typography>
      </Box>
    </Box>
  );
}

export function Layout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 1.5,
        py: 2.5,
      }}
    >
      <Box sx={{ px: 1.25, pb: 3.5 }}>
        <Brand />
      </Box>
      <Typography
        sx={{
          px: 1.25,
          mb: 1,
          color: "rgba(255,255,255,.38)",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: ".13em",
          textTransform: "uppercase",
        }}
      >
        Workspace
      </Typography>
      <List disablePadding sx={{ display: "grid", gap: 0.5 }}>
        {navigation.map(({ label, path, icon }) => {
          const active =
            location.pathname === path ||
            location.pathname.startsWith(`${path}/`);
          return (
            <ListItemButton
              key={path}
              component={NavLink}
              to={path}
              onClick={() => setMobileOpen(false)}
              selected={active}
              sx={{
                minHeight: 46,
                borderRadius: 2.5,
                color: active ? "#fff" : "rgba(224,231,255,.62)",
                "& .MuiListItemIcon-root": { color: "inherit", minWidth: 38 },
                "&.Mui-selected": {
                  background: "rgba(96,165,250,.16)",
                  color: "#fff",
                  "&:hover": { background: "rgba(96,165,250,.22)" },
                },
                "&:hover": {
                  background: "rgba(255,255,255,.07)",
                  color: "#fff",
                },
              }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: active ? 700 : 550,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box
        sx={{
          mt: "auto",
          p: 1.5,
          border: "1px solid rgba(255,255,255,.09)",
          borderRadius: 3,
          color: "rgba(224,231,255,.58)",
        }}
      >
        <Typography
          sx={{
            color: "rgba(255,255,255,.78)",
            fontSize: 12,
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          Secure workspace
        </Typography>
        <Typography sx={{ fontSize: 11, lineHeight: 1.5 }}>
          Your compensation data is protected and currency-aware.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "background.default",
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          color: "text.primary",
          background: "rgba(245,247,251,.88)",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(14px)",
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, gap: 1.5 }}>
          <IconButton
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" }, color: "text.primary" }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                color: "text.secondary",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              HR management workspace
            </Typography>
            <Typography sx={{ fontSize: { xs: 15, sm: 16 }, fontWeight: 750 }}>
              {location.pathname.startsWith("/employees")
                ? "Employee directory"
                : "Compensation overview"}
            </Typography>
          </Box>
          <Button
            color="inherit"
            onClick={(event) => setAccountAnchor(event.currentTarget)}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            sx={{ minWidth: 0, px: 1, color: "text.primary" }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                mr: { xs: 0, sm: 1 },
                color: "#1d4ed8",
                bgcolor: "#dbeafe",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              HR
            </Avatar>
            <Box
              sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}
            >
              <Typography
                sx={{ fontSize: 12, fontWeight: 750, lineHeight: 1.2 }}
              >
                HR Manager
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 10 }}>
                Administrator
              </Typography>
            </Box>
          </Button>
          <Menu
            anchorEl={accountAnchor}
            open={Boolean(accountAnchor)}
            onClose={() => setAccountAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setAccountAnchor(null);
                logout();
              }}
              sx={{ gap: 1 }}
            >
              <LogoutRoundedIcon fontSize="small" /> Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        aria-label="Primary navigation"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              bgcolor: "#101a33",
              border: 0,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              bgcolor: "#101a33",
              border: 0,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, pt: { xs: 8, md: 9 } }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 2.5, sm: 4, md: 5 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
