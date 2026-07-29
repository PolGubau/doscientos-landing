import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Lock,
  Minus,
  Plus,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOOLS = ["CRM", "ERP", "Presupuestos", "Contabilidad", "RR. HH."];
const TEAMS = ["Comercial", "Operaciones", "Administración", "Finanzas", "Personas"];
const TOTAL_STEPS = 5;

type TeamPeople = Record<string, number>;

const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function ProcessLossCalculator() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [step, setStep] = useState(1);
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [stepError, setStepError] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [sharedTools, setSharedTools] = useState(2);
  const [teamPeople, setTeamPeople] = useState<TeamPeople>({});
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [hourlyCost, setHourlyCost] = useState(28);

  const selectedTeams = Object.entries(teamPeople).filter(([, count]) => count > 0);
  const people = selectedTeams.reduce((total, [, count]) => total + count, 0);
  const usesSeveralTools = tools.length > 1;

  const result = useMemo(() => {
    const duplicated = usesSeveralTools ? Math.min(sharedTools, tools.length) : 1;
    const duplicationFactor =
      1 +
      Math.max(0, duplicated - 1) * 0.12 +
      Math.max(0, tools.length - duplicated) * 0.04;
    const yearlyHours = Math.round(people * weeklyHours * 46 * duplicationFactor);
    const yearlyCost = Math.round(yearlyHours * hourlyCost);
    return { yearlyHours, yearlyCost };
  }, [hourlyCost, people, sharedTools, tools.length, usesSeveralTools, weeklyHours]);

  const unlockCalculator = (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("Escribe un correo válido para ver el resultado.");
      return;
    }
    setEmailError("");
    setEmailCaptured(true);
  };

  const toggleTool = (tool: string) => {
    setStepError("");
    setTools((current) =>
      current.includes(tool)
        ? current.filter((item) => item !== tool)
        : [...current, tool],
    );
  };

  const updateTeam = (team: string, change: number) => {
    setStepError("");
    setTeamPeople((current) => ({
      ...current,
      [team]: Math.max(0, (current[team] || 0) + change),
    }));
  };

  const nextStep = () => {
    if (step === 1 && tools.length === 0) {
      setStepError("Selecciona al menos una herramienta.");
      return;
    }
    if (step === 3 && people === 0) {
      setStepError("Indica al menos una persona afectada.");
      return;
    }
    setStepError("");
    if (step === 1 && tools.length === 1) {
      setStep(3);
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS + 1, current + 1));
  };

  const previousStep = () => {
    setStepError("");
    if (step === 3 && tools.length === 1) {
      setStep(1);
      return;
    }
    setStep((current) => Math.max(1, current - 1));
  };

  if (step === TOTAL_STEPS + 1 && !emailCaptured) {
    return (
      <form onSubmit={unlockCalculator} className="space-y-6" noValidate>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BarChart3 className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Tu análisis está listo
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Déjanos tu correo profesional para desbloquear el coste anual y el
            desglose completo por equipo.
          </p>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-foreground">
            Correo profesional
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError("");
            }}
            placeholder="tu@empresa.com"
            autoComplete="email"
            inputMode="email"
            className="h-13 w-full rounded-xl border border-muted-foreground/30 bg-background px-4 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-describedby={emailError ? "calculator-email-error" : undefined}
          />
        </label>
        {emailError && (
          <p id="calculator-email-error" role="alert" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 font-semibold text-background transition-opacity hover:opacity-90"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
          Ver mi resultado
        </button>
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden="true" />
          El correo no se envía ni se guarda
        </p>
      </form>
    );
  }

  if (step === TOTAL_STEPS + 1) {
    return (
      <div className="space-y-6" aria-live="polite">
        <div className="rounded-2xl bg-primary p-6 text-background">
          <p className="text-sm font-medium text-background/90">
            Coste anual estimado
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">
            {euro.format(result.yearlyCost)}
          </p>
          <p className="mt-3 leading-relaxed text-background/90">
            Aproximadamente{" "}
            <strong>{result.yearlyHours.toLocaleString("es-ES")} horas al año</strong>{" "}
            en tareas manuales, búsquedas y reconciliación de datos.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Tiempo perdido por equipo
          </p>
          {selectedTeams.map(([team, count]) => {
            const teamHours = Math.round((count / people) * result.yearlyHours);
            return (
              <div
                key={team}
                className="flex items-center justify-between gap-4 rounded-xl border border-muted bg-background px-4 py-3"
              >
                <span className="font-medium text-foreground">{team}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {teamHours.toLocaleString("es-ES")} h/año
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full text-sm font-medium text-muted-foreground underline hover:text-foreground"
        >
          Cambiar mis respuestas
        </button>
      </div>
    );
  }

  const stepContent = {
    1: (
      <>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          ¿Qué herramientas utilizáis?
        </h3>
        <p className="text-muted-foreground">
          Selecciona todas las que forman parte de vuestra operativa.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const active = tools.includes(tool);
            return (
              <button
                key={tool}
                type="button"
                onClick={() => toggleTool(tool)}
                aria-pressed={active}
                className={`flex min-h-14 items-center justify-between rounded-xl border px-4 text-left font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-background"
                    : "border-muted bg-background text-foreground hover:border-primary"
                }`}
              >
                {tool}
                <Check className={`size-5 ${active ? "opacity-100" : "opacity-0"}`} />
              </button>
            );
          })}
        </div>
      </>
    ),
    2: (
      <>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          ¿Cuántas comparten la misma información?
        </h3>
        <p className="text-muted-foreground">
          Piensa en clientes, facturas, proyectos o empleados que se copian
          entre sistemas.
        </p>
        <div className="rounded-2xl border border-muted bg-muted/30 p-5">
          <label htmlFor="shared-tools" className="text-sm font-semibold text-foreground">
            Herramientas con datos duplicados
          </label>
          <div className="mt-5 flex items-center gap-4">
            <input
              id="shared-tools"
              type="range"
              min="2"
              max={tools.length}
              value={Math.min(sharedTools, tools.length)}
              onChange={(event) => setSharedTools(Number(event.target.value))}
              className="w-full accent-primary"
            />
            <output className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-background">
              {Math.min(sharedTools, tools.length)}
            </output>
          </div>
        </div>
      </>
    ),
    3: (
      <>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          ¿Qué equipos pierden tiempo?
        </h3>
        <p className="text-muted-foreground">
          Indica cuántas personas consultan, copian o revisan datos cada semana.
        </p>
        <div className="space-y-3">
          {TEAMS.map((team) => {
            const count = teamPeople[team] || 0;
            return (
              <div
                key={team}
                className="flex min-h-14 items-center justify-between rounded-xl border border-muted bg-background px-4"
              >
                <span className="font-semibold text-foreground">{team}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateTeam(team, -1)}
                    disabled={count === 0}
                    aria-label={`Restar una persona de ${team}`}
                    className="flex size-10 items-center justify-center rounded-full border border-muted text-foreground disabled:opacity-30"
                  >
                    <Minus className="size-4" />
                  </button>
                  <output className="w-5 text-center font-bold text-foreground">
                    {count}
                  </output>
                  <button
                    type="button"
                    onClick={() => updateTeam(team, 1)}
                    aria-label={`Sumar una persona a ${team}`}
                    className="flex size-10 items-center justify-center rounded-full bg-primary text-background"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </>
    ),
    4: (
      <>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          ¿Cuánto tiempo pierde cada persona?
        </h3>
        <p className="text-muted-foreground">
          Incluye copiar datos, buscar información, actualizar hojas y revisar
          que todo coincida.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 3, 5, 8].map((hours) => (
            <button
              key={hours}
              type="button"
              onClick={() => setWeeklyHours(hours)}
              aria-pressed={weeklyHours === hours}
              className={`min-h-20 rounded-xl border p-4 text-left transition-colors ${
                weeklyHours === hours
                  ? "border-primary bg-primary text-background"
                  : "border-muted bg-background text-foreground hover:border-primary"
              }`}
            >
              <span className="block text-xl font-bold">{hours} h</span>
              <span className="text-sm opacity-90">por persona y semana</span>
            </button>
          ))}
        </div>
      </>
    ),
    5: (
      <>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          ¿Cuál es el coste/hora aproximado?
        </h3>
        <p className="text-muted-foreground">
          Una estimación sencilla para convertir el tiempo en impacto anual.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[22, 28, 35].map((cost) => (
            <button
              key={cost}
              type="button"
              onClick={() => setHourlyCost(cost)}
              aria-pressed={hourlyCost === cost}
              className={`min-h-20 rounded-xl border p-4 text-left transition-colors ${
                hourlyCost === cost
                  ? "border-primary bg-primary text-background"
                  : "border-muted bg-background text-foreground hover:border-primary"
              }`}
            >
              <span className="block text-xl font-bold">{cost} €/h</span>
              <span className="text-sm opacity-90">coste estimado</span>
            </button>
          ))}
        </div>
      </>
    ),
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>
          Pregunta {step} de {TOTAL_STEPS}
        </span>
        <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
      <div className="min-h-72 space-y-5">
        {stepContent[step as keyof typeof stepContent]}
      </div>
      {stepError && (
        <p role="alert" className="text-sm text-destructive">
          {stepError}
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={previousStep}
          className="flex size-12 items-center justify-center rounded-full border border-muted text-foreground"
          aria-label="Volver a la pregunta anterior"
        >
          <ArrowLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 font-semibold text-background transition-opacity hover:opacity-90"
        >
          {step === TOTAL_STEPS ? "Ver mi resultado" : "Continuar"}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
