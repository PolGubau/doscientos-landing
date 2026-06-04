import Cal, { getCalApi } from "@calcom/embed-react";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { branding } from "~/config/branding";

const CAL_LINK = branding.contact.calCom.path;

type CalEmbedProps = {
  name: string;
  email: string;
};

export function CalEmbed({ name, email }: CalEmbedProps) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  return (
    <div className="space-y-6 motion-fade-in motion-duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
          <Check className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">
          ¡Datos recibidos!
        </h3>
        <p className="text-muted-foreground">
          Elige el día y la hora que mejor te vaya para que te llamemos. Si no
          ves tu zona horaria correcta, ajústala en la esquina inferior
          izquierda del calendario.
        </p>
      </div>

      <Cal
        calLink={CAL_LINK}
        style={{ width: "100%", height: "100%", minHeight: "500px" }}
        config={{ name, email, layout: "month_view" }}
      />
    </div>
  );
}
