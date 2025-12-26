"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/auth";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Processing...");

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        console.log("Auth Callback - Params:", { code: !!code, error });

        if (code) {
            console.log("Code found in URL",searchParams);
            setStatus("Verifying with server...");

            // Verify code with backend
            const verifyCode = async () => {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                    const res = await fetch(`${apiUrl}/api/auth/google/verify`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code }) // Sending as JSON { "code": "..." }
                    });

                    if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(errData.detail || "Verification failed");
                    }

                    const data = await res.json();

                    if (data.access_token) {
                        setStatus("Authentication successful. Saving token...");
                        setAccessToken(data.access_token);
                        setStatus("Redirecting to home...");
                        window.location.replace("/");
                    } else {
                        throw new Error("No token received");
                    }

                } catch (e: any) {
                    console.error("Verification Error:", e);
                    setStatus(`Error: ${e.message || "Login failed"}`);
                }
            };

            verifyCode();

        } else if (error) {
            console.log("Error found in URL",searchParams);
            setStatus(`Authentication error: ${error}`);
        } else {
            console.log("No code or error found in URL",searchParams);
            // Check if we maybe already have a token in URL (fallback for old flow?)
            const token = searchParams.get("token");
            if (token) {
                setAccessToken(token);
                window.location.replace("/");
            } else {
                console.warn("No code or error found in URL");
                setStatus("No authentication code found. Please try logging in again.");
            }
        }
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <div className="mb-4 flex justifying-center">
                    {status.includes("error") || status.includes("No") ? (
                        <div className="mx-auto text-red-500 text-4xl">⚠️</div>
                    ) : (
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                    )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Login Status</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{status}</p>

                {(status.includes("Redirecting") || status.includes("successful")) && (
                    <button
                        onClick={() => window.location.replace("/")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out w-full"
                    >
                        Click here if not redirected
                    </button>
                )}

                {(status.includes("error") || status.includes("No")) && (
                    <button
                        onClick={() => router.push("/login")}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out w-full"
                    >
                        Back to Login
                    </button>
                )}
            </div>
        </div>
    );
}

export default function () {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
