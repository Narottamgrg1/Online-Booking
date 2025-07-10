import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "../../../lib/apiReq";

function VerifyEmailPage() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setMessage("Please enter all 6 digits.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("Verifying...");

    try {
      const res = await apiRequest.post("/auth/verify-email", { code });
      setStatus("success");
      setMessage(res.data.message || "Email verified successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Verification failed.");
    }
  };

  const handleResendCode = async () => {
    setIsResendDisabled(true);
    setTimer(30); // 30-second cooldown

    try {
      await apiRequest.post("/auth/resend-code", {}); // Replace with your actual resend code API endpoint
      setMessage("Verification code has been resent!");
    } catch (err) {
      setMessage("Failed to resend the code.");
    }

    setTimeout(() => {
      setIsResendDisabled(false);
    }, 30000); // 30 seconds cooldown
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Enter Verification Code</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-10 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {status === "loading" ? "Verifying..." : "Verify"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 text-center font-medium ${status === "success" ? "text-green-600" : "text-red-500"
              }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleResendCode}
            disabled={isResendDisabled}
            className={`text-blue-500 hover:text-white ${isResendDisabled ? "cursor-not-allowed text-gray-400" : ""
              }`}
          >
            {isResendDisabled ? `Resend Code in ${timer}s` : "Resend Code"}
          </button>
        </div>

        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block text-center text-blue-500 hover:underline"
        >
          Open Gmail ↗
        </a>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
