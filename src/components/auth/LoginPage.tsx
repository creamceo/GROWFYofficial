// src/components/auth/LoginPage.tsx
import React, { useState } from "react";
import { colors, radius, shadows } from "../../theme";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { useNavigate } from "react-router-dom";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();

  const emailValid = emailRegex.test(email);
  const passwordValid = password.length >= 6;
  const isValid = emailValid && passwordValid;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, #F4F6F2 0, #EFF1ED 45%, #E5E7E0 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 20,
          padding: "40px 40px 32px",
          background:
            "linear-gradient(130deg, rgba(245,245,238,0.65), rgba(222,227,216,0.55))",
          boxShadow: `${shadows.glassInner}, 0 26px 60px rgba(0,0,0,0.12)`,
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.65)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: colors.textMain,
            }}
          >
            GROWFY
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: colors.textSoft,
            }}
          >
            LEARNING PLATFORM
          </div>
        </div>

        <h1
          style={{
            margin: "0 0 24px",
            fontSize: 32,
            lineHeight: 1.15,
            color: "#000000",
            fontWeight: 600,
          }}
        >
          Вход в платформу
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input
            label="E‑mail"
            type="email"
            value={email}
            placeholder="name@company.com"
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={
              touched.email && !emailValid
                ? "Проверьте корректность e‑mail."
                : undefined
            }
          />

          <Input
            label="Пароль"
            type="password"
            value={password}
            placeholder="Минимум 6 символов"
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={
              touched.password && !passwordValid
                ? "Минимум 6 символов."
                : undefined
            }
            rightSlot={
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "1.5px solid #5A6650",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 10,
                    height: 6,
                    borderRadius: 999,
                    border: "1.5px solid #5A6650",
                    borderTop: "none",
                    borderBottom: "none",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </span>
            }
          />
        </div>

        <Button
          style={{ marginTop: 28, width: "100%", height: 56, borderRadius: 20 }}
          disabled={!isValid}
          onClick={() => navigate("/courses")}
        >
          Войти
        </Button>
      </div>
    </div>
  );
};
