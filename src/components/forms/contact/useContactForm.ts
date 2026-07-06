import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import {
	type ContactValues,
	EMPTY_FORM,
	ERROR_MESSAGES,
	FALLBACK_ERROR,
	type FormStatus,
	STORAGE_KEY,
} from "./types";

const LEADS_ENDPOINT =
	import.meta.env.PUBLIC_LEADS_ENDPOINT ||
	"https://app.doscientos.es/api/public/leads";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{9,}$/;

function validate(name: string, value: string): string {
	switch (name) {
		case "name":
			if (!value.trim()) return "El nombre es obligatorio";
			if (value.trim().length < 2) return "Mínimo 2 caracteres";
			return "";
		case "email":
			if (!value.trim()) return "El email es obligatorio";
			if (!EMAIL_RE.test(value)) return "Email inválido";
			return "";
		case "phone":
			if (!value.trim()) return "El teléfono es obligatorio";
			if (!PHONE_RE.test(value)) return "Teléfono inválido";
			return "";
		default:
			return "";
	}
}

export function useContactForm() {
	const [step, setStep] = useState(1);
	const [stepDirection, setStepDirection] = useState<1 | -1>(1);
	const [status, setStatus] = useState<FormStatus>("idle");
	const [errorMessage, setErrorMessage] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const dedupeKey = useRef(crypto.randomUUID());

	const [formData, setFormData] = useState<ContactValues>(() => {
		if (typeof window === "undefined") return EMPTY_FORM;
		try {
			const saved = window.localStorage.getItem(STORAGE_KEY);
			return saved ? { ...EMPTY_FORM, ...JSON.parse(saved) } : EMPTY_FORM;
		} catch {
			return EMPTY_FORM;
		}
	});

	const contextParams = useRef({
		utm_source: "",
		utm_medium: "",
		utm_campaign: "",
	});

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		contextParams.current = {
			utm_source: params.get("utm_source") || "",
			utm_medium: params.get("utm_medium") || "",
			utm_campaign: params.get("utm_campaign") || "",
		};
	}, []);

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
		} catch {
			// localStorage no disponible (modo privado / SSR)
		}
	}, [formData]);

	const validateField = (name: string, value: string) => {
		const error = validate(name, value);
		setFieldErrors((prev) => {
			const next = { ...prev };
			if (error) next[name] = error;
			else delete next[name];
			return next;
		});
		return !error;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (touched[name]) validateField(name, value);
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setTouched((prev) => ({ ...prev, [name]: true }));
		validateField(name, value);
	};

	const selectBudget = (value: string) =>
		setFormData((prev) => ({ ...prev, budget: value }));

	const selectCompanySize = (value: string) =>
		setFormData((prev) => ({ ...prev, companySize: value }));

	const selectUrgency = (value: string) =>
		setFormData((prev) => ({ ...prev, urgency: value }));

	const nextStep = () => {
		const nameOk = validateField("name", formData.name);
		const emailOk = validateField("email", formData.email);
		setTouched((prev) => ({ ...prev, name: true, email: true }));
		if (nameOk && emailOk) {
			setStepDirection(1);
			setStep(2);
		} else {
			const firstInvalid = !nameOk ? "name" : "email";
			requestAnimationFrame(() => {
				(
					document.getElementById(firstInvalid) as HTMLInputElement | null
				)?.focus();
			});
		}
	};

	const prevStep = () => {
		setStepDirection(-1);
		setStep(1);
	};

	const handleStep1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			nextStep();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const isPhoneValid = validateField("phone", formData.phone);
		setTouched((prev) => ({ ...prev, phone: true }));
		if (!isPhoneValid) return;

		setStatus("loading");

		const honeypot = (e.currentTarget as HTMLFormElement).elements.namedItem(
			"website",
		);
		const website = honeypot instanceof HTMLInputElement ? honeypot.value : "";

		// Si el honeypot está lleno, simulamos éxito para despistar al bot
		if (website) {
			console.warn("Honeypot triggered");
			setStatus("success");
			setStep(3);
			return;
		}

		const body = {
			name: formData.name,
			email: formData.email,
			phone: formData.phone,
			company: formData.company,
			companySize: formData.companySize,
			urgency: formData.urgency,
			message: "Lead desde formulario corto (multi-step)",
			budget: formData.budget,
			dedupeKey: dedupeKey.current,
			website, // honeypot — debe quedar vacío
			utm_source: contextParams.current.utm_source,
			utm_medium: contextParams.current.utm_medium,
			utm_campaign: contextParams.current.utm_campaign,
			referrer: document.referrer ?? "",
		};

		try {
			const response = await fetch(LEADS_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				setStatus("error");
				setErrorMessage(ERROR_MESSAGES[response.status] ?? FALLBACK_ERROR);
				return;
			}

			setStatus("success");
			setStep(3);
			try {
				window.localStorage.removeItem(STORAGE_KEY);
			} catch {
				// localStorage no disponible
			}
			confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
			if ("gtag" in window) {
				// @ts-ignore
				window.gtag("event", "generate_lead", {
					event_category: "contact",
					event_label: "contact_form_multistep",
				});
			}

			if ("fbq" in window) {
				// @ts-ignore
				window.fbq("track", "Lead", {
					content_name: "contact_form_multistep",
					status: "success",
				});
			}
		} catch (err) {
			setStatus("error");
			setErrorMessage("Error de conexión. Verifica tu internet.");
			console.error("Error completo:", err);
		}
	};

	return {
		step,
		status,
		errorMessage,
		stepDirection,
		fieldErrors,
		touched,
		formData,
		handleChange,
		handleBlur,
		handleStep1KeyDown,
		selectBudget,
		selectCompanySize,
		selectUrgency,
		nextStep,
		prevStep,
		handleSubmit,
	};
}
