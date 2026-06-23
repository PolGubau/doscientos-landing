/**
 * Fuente única de los packs de webs para negocios locales.
 * Consumido por /landings (conversión, noindex) y /packs/* (SEO, indexable).
 * Los iconos se guardan como nombre de lucide y se mapean a componente en cada .astro.
 */

export interface PackBenefit {
	title: string;
	description: string;
	icon: string;
}

export interface PackFaq {
	question: string;
	answer: string;
}

export interface Pack {
	slug: string;
	sector: string;
	title: string;
	icon: string;
	featured?: boolean;
	audience?: string;
	install: string;
	monthly: string;
	installAmount: number;
	monthlyAmount: number;
	/** Slugs de los extras del grid que el pack incluye sobre el plan base. */
	bundledExtras: string[];
	tagline: string;
	cta: string;
	features: string[];
	metaTitle: string;
	metaDescription: string;
	heroTitle: string;
	heroSubtitle: string;
	intro: string;
	problem: string;
	solution: string;
	benefits: PackBenefit[];
	keywords: string[];
	faqs: PackFaq[];
}

export const packs: Pack[] = [
	{
		slug: "web-para-barberia",
		sector: "Barbería",
		title: "Pack Barbería",
		icon: "Scissors",
		featured: true,
		install: "290€",
		monthly: "26€/mes",
		installAmount: 290,
		monthlyAmount: 26,
		bundledExtras: ["booksy", "galeria-avanzada", "instagram"],
		tagline:
			"Convierte visitantes en reservas y muestra tus mejores trabajos de forma profesional.",
		cta: "Solicitar Pack Barbería",
		features: [
			"Diseño profesional personalizado",
			"Integración con Booksy",
			"Galería de trabajos",
			"Botón de WhatsApp",
			"Integración con Instagram",
			"Mapa de ubicación",
			"Dominio incluido",
			"Hosting incluido",
			"Soporte incluido",
		],
		metaTitle:
			"Web para barbería desde 290€ | Reservas online y galería | doscientos",
		metaDescription:
			"Página web profesional para barberías: reservas con Booksy, galería de trabajos, WhatsApp e Instagram. Desde 290€ + 26€/mes con dominio, hosting y soporte incluidos.",
		heroTitle: "La web que llena la agenda de tu barbería",
		heroSubtitle:
			"Una página rápida y profesional que convierte visitas en reservas, conectada a tu sistema de citas.",
		intro:
			"Tus clientes te buscan en el móvil antes de pasar por la barbería. Si lo único que encuentran es una ficha de Google sin web, pierdes reservas frente a la competencia que sí transmite confianza desde el primer vistazo.",
		problem:
			"La mayoría de barberías dependen solo de redes sociales o del paso de gente. Sin una web propia es difícil mostrar tu estilo, tus precios y, sobre todo, dejar que el cliente reserve en el momento en que decide hacerlo.",
		solution:
			"Montamos una web pensada para reservar: conectada a Booksy, con una galería que enseña tus mejores cortes, enlaces directos a WhatsApp e Instagram y tu ubicación en el mapa. Todo optimizado para móvil, que es donde están tus clientes.",
		benefits: [
			{
				title: "Reservas sin fricción",
				description:
					"Integración directa con Booksy para que el cliente reserve en dos toques, sin llamadas ni esperas.",
				icon: "CalendarCheck",
			},
			{
				title: "Tu trabajo entra por los ojos",
				description:
					"Galería profesional de cortes y degradados que genera confianza y diferencia tu barbería del resto.",
				icon: "Sparkles",
			},
			{
				title: "Te encuentran en tu barrio",
				description:
					"Mapa de ubicación y SEO local básico para aparecer cuando buscan 'barbería cerca de mí'.",
				icon: "MapPin",
			},
		],
		keywords: [
			"web para barbería",
			"página web barbería",
			"reservas online barbería",
			"web barbería booksy",
		],
		faqs: [
			{
				question: "¿Se conecta con mi cuenta de Booksy?",
				answer:
					"Sí. Integramos tu enlace de reservas de Booksy para que los clientes reserven directamente desde la web, sin pasos intermedios.",
			},
			{
				question: "¿Puedo actualizar la galería de trabajos yo mismo?",
				answer:
					"Las actualizaciones puntuales entran dentro del mantenimiento. Si quieres gestionarla tú, podemos añadir una galería autogestionable como extra.",
			},
			{
				question: "¿Cuánto tarda en estar publicada?",
				answer:
					"Con las fotos y los textos básicos, una barbería suele estar online en pocos días.",
			},
		],
	},
	{
		slug: "web-para-restaurante",
		sector: "Restaurante",
		title: "Pack Restaurante",
		icon: "Utensils",
		install: "290€",
		monthly: "26€/mes",
		installAmount: 290,
		monthlyAmount: 26,
		bundledExtras: ["galeria-avanzada", "correo", "instagram"],
		tagline:
			"Permite que tus clientes consulten tu carta y contacten contigo fácilmente desde cualquier dispositivo.",
		cta: "Solicitar Pack Restaurante",
		features: [
			"Diseño profesional personalizado",
			"Carta digital",
			"Galería de platos",
			"Botón de llamada directa",
			"WhatsApp",
			"Google Maps",
			"Dominio incluido",
			"Hosting incluido",
			"Soporte incluido",
		],
		metaTitle:
			"Web para restaurante desde 290€ | Carta digital y reservas | doscientos",
		metaDescription:
			"Página web para restaurantes con carta digital, galería de platos, llamada directa, WhatsApp y Google Maps. Desde 290€ + 26€/mes con dominio, hosting y soporte incluidos.",
		heroTitle: "La carta de tu restaurante, siempre a un toque",
		heroSubtitle:
			"Una web rápida con tu carta digital, fotos que abren el apetito y contacto directo para reservar mesa.",
		intro:
			"Antes de elegir dónde comer, la gente mira la carta y las fotos en el móvil. Si tu restaurante no las tiene online —o están en un PDF que tarda en abrir— el cliente se va al de al lado.",
		problem:
			"Las cartas en PDF pesan, se ven mal en el móvil y se quedan desactualizadas. Y sin un botón claro para llamar o llegar, conviertes muchas menos visitas en reservas reales.",
		solution:
			"Creamos una web con carta digital ligera y fácil de actualizar, galería de tus mejores platos, botón de llamada directa, WhatsApp y tu ubicación en Google Maps. Todo pensado para abrirse al instante desde el móvil.",
		benefits: [
			{
				title: "Carta digital que carga al instante",
				description:
					"Sin PDFs pesados: una carta que se ve perfecta en el móvil y se actualiza cuando cambias el menú.",
				icon: "FileText",
			},
			{
				title: "Tus platos entran por los ojos",
				description:
					"Galería profesional que despierta el apetito y aumenta el ticket medio antes de que lleguen.",
				icon: "Sparkles",
			},
			{
				title: "Reservas y llegadas más fáciles",
				description:
					"Botón de llamada directa, WhatsApp y Google Maps para que reservar y encontrarte sea inmediato.",
				icon: "Headphones",
			},
		],
		keywords: [
			"web para restaurante",
			"página web restaurante",
			"carta digital restaurante",
			"web restaurante con reservas",
		],
		faqs: [
			{
				question: "¿Puedo cambiar la carta cuando cambie el menú?",
				answer:
					"Sí. Los cambios de carta entran dentro del mantenimiento mensual. Si actualizas el menú a menudo, podemos dejarte una carta autogestionable.",
			},
			{
				question: "¿Incluye sistema de reservas?",
				answer:
					"El pack incluye llamada directa y WhatsApp. Si quieres reservas con calendario propio o Calendly, lo añadimos como extra.",
			},
			{
				question: "¿Sirve para cartas con muchos platos?",
				answer:
					"Sí. Organizamos la carta por categorías para que se navegue cómodamente, por extensa que sea.",
			},
		],
	},
	{
		slug: "web-para-gimnasio",
		sector: "Gimnasio",
		title: "Pack Gimnasio",
		icon: "Dumbbell",
		install: "290€",
		monthly: "26€/mes",
		installAmount: 290,
		monthlyAmount: 26,
		bundledExtras: ["galeria-avanzada", "formularios-avanzados", "instagram"],
		tagline:
			"Muestra tus instalaciones, tarifas y horarios para convertir visitas en nuevos socios.",
		cta: "Solicitar Pack Gimnasio",
		features: [
			"Diseño profesional personalizado",
			"Horarios",
			"Tarifas",
			"Galería de instalaciones",
			"Formulario de contacto",
			"WhatsApp",
			"Dominio incluido",
			"Hosting incluido",
			"Soporte incluido",
		],
		metaTitle:
			"Web para gimnasio desde 290€ | Tarifas, horarios y altas | doscientos",
		metaDescription:
			"Página web para gimnasios y centros deportivos: tarifas, horarios, galería de instalaciones, formulario de alta y WhatsApp. Desde 290€ + 26€/mes con todo incluido.",
		heroTitle: "La web que convierte curiosos en socios",
		heroSubtitle:
			"Tarifas claras, horarios al día y un formulario de alta directo para captar socios sin fricción.",
		intro:
			"Quien busca gimnasio compara precios, horarios e instalaciones antes de pisar la recepción. Si no encuentra esa información en tu web, descarta y prueba con otro.",
		problem:
			"Las dudas sobre tarifas y horarios frenan las altas. Y sin fotos de las instalaciones ni una forma clara de contactar, el interesado pierde el impulso de apuntarse.",
		solution:
			"Montamos una web que responde lo que el futuro socio quiere saber: tarifas, horarios actualizados, galería de instalaciones y un formulario de contacto con WhatsApp para resolver dudas y cerrar el alta al momento.",
		benefits: [
			{
				title: "Tarifas y horarios sin dudas",
				description:
					"Información clara y actualizada que elimina las objeciones antes de que aparezcan.",
				icon: "CircleDollarSign",
			},
			{
				title: "Instalaciones que convencen",
				description:
					"Galería profesional de tu espacio y equipamiento para transmitir nivel y limpieza.",
				icon: "Sparkles",
			},
			{
				title: "Altas directas",
				description:
					"Formulario de contacto y WhatsApp para captar al interesado en el momento de máxima intención.",
				icon: "FileText",
			},
		],
		keywords: [
			"web para gimnasio",
			"página web gimnasio",
			"web centro deportivo",
			"captar socios gimnasio",
		],
		faqs: [
			{
				question: "¿Puedo actualizar tarifas y horarios?",
				answer:
					"Sí. Los cambios de tarifas y horarios entran dentro del mantenimiento mensual.",
			},
			{
				question: "¿Se pueden gestionar las altas desde la web?",
				answer:
					"El pack incluye formulario de contacto y WhatsApp. Si quieres un sistema de reservas o pagos, lo valoramos como desarrollo aparte.",
			},
			{
				question: "¿Sirve para estudios pequeños o boxes de crossfit?",
				answer:
					"Sí. El enfoque es el mismo: enseñar instalaciones, tarifas y horarios para captar socios, sea cual sea el tamaño.",
			},
		],
	},
	{
		slug: "web-para-profesionales",
		sector: "Profesionales",
		title: "Pack Profesional",
		icon: "BriefcaseBusiness",
		audience: "Abogados, asesorías, consultorías y autónomos.",
		install: "350€",
		monthly: "34€/mes",
		installAmount: 350,
		monthlyAmount: 34,
		bundledExtras: ["formularios-avanzados", "correo", "seo-local"],
		tagline:
			"Genera confianza y consigue nuevos clientes con una presencia online profesional.",
		cta: "Solicitar Pack Profesional",
		features: [
			"Diseño profesional personalizado",
			"Página de servicios",
			"Formulario de contacto",
			"WhatsApp",
			"Google Maps",
			"Dominio incluido",
			"Hosting incluido",
			"Soporte incluido",
		],
		metaTitle: "Web para asesorías y profesionales desde 350€ | doscientos",
		metaDescription:
			"Página web profesional para abogados, asesorías, consultorías y autónomos: página de servicios, formulario de contacto, WhatsApp y Google Maps. Desde 350€ + 34€/mes.",
		heroTitle: "La web que transmite la confianza que tu cliente busca",
		heroSubtitle:
			"Una presencia online seria y clara que explica tus servicios y convierte visitas en consultas.",
		intro:
			"Cuando alguien necesita un abogado, una asesoría o un consultor, busca señales de confianza: experiencia, claridad y una forma sencilla de contactar. Sin web, esa confianza la encuentra en otro.",
		problem:
			"Muchos profesionales dependen del boca a boca, pero pierden a quien les busca en Google y no encuentra nada sólido. Un perfil sin web proyecta menos seriedad de la que realmente tienes.",
		solution:
			"Creamos una web sobria y profesional con una página de servicios clara, formulario de contacto, WhatsApp y tu ubicación. El objetivo: que quien te encuentre entienda qué haces y dé el paso de escribirte.",
		benefits: [
			{
				title: "Imagen que genera confianza",
				description:
					"Diseño serio y cuidado, alineado con tu sector, que respalda tu autoridad profesional.",
				icon: "ShieldCheck",
			},
			{
				title: "Servicios explicados con claridad",
				description:
					"Una página de servicios que ordena lo que ofreces y responde las dudas del cliente.",
				icon: "FileText",
			},
			{
				title: "Contacto directo",
				description:
					"Formulario y WhatsApp para que la consulta llegue sin fricción y no se pierda ningún cliente.",
				icon: "Headphones",
			},
		],
		keywords: [
			"web para asesoría",
			"web para abogados",
			"página web profesionales",
			"web para autónomos",
		],
		faqs: [
			{
				question: "¿Sirve para mi sector concreto?",
				answer:
					"Sí. El pack está pensado para profesionales de servicios ,abogados, asesorías, consultorías, autónomos— y adaptamos los textos a tu actividad.",
			},
			{
				question: "¿Puedo añadir más páginas de servicios?",
				answer:
					"El pack incluye una página de servicios. Si necesitas más secciones o un blog, lo añadimos como extra.",
			},
			{
				question: "¿Aparece mi despacho en Google Maps?",
				answer:
					"Sí. Integramos tu ubicación y podemos reforzar el SEO local como extra para aparecer mejor en tu zona.",
			},
		],
	},
	{
		slug: "web-para-clinica",
		sector: "Clínica",
		title: "Pack Clínica",
		icon: "HeartPulse",
		audience: "Fisioterapeutas, psicólogos, dentistas y centros médicos.",
		install: "350€",
		monthly: "34€/mes",
		installAmount: 350,
		monthlyAmount: 34,
		bundledExtras: ["formularios-avanzados", "correo", "seo-local"],
		tagline:
			"Facilita que nuevos pacientes encuentren tu clínica y contacten contigo.",
		cta: "Solicitar Pack Clínica",
		features: [
			"Diseño profesional personalizado",
			"Página de servicios",
			"Presentación del equipo",
			"Formulario de contacto",
			"WhatsApp",
			"Google Maps",
			"Dominio incluido",
			"Hosting incluido",
			"Soporte incluido",
		],
		metaTitle:
			"Web para clínica desde 350€ | Capta pacientes online | doscientos",
		metaDescription:
			"Página web para clínicas y centros de salud: servicios, presentación del equipo, formulario de contacto, WhatsApp y Google Maps. Desde 350€ + 34€/mes con todo incluido.",
		heroTitle: "La web que ayuda a nuevos pacientes a confiar en tu clínica",
		heroSubtitle:
			"Una presencia clara y cercana que explica tus tratamientos, presenta a tu equipo y facilita pedir cita.",
		intro:
			"Elegir clínica es una decisión sensible. El paciente quiere saber quién le va a atender, qué tratamientos ofreces y cómo contactar. Sin web, esas dudas las resuelve en otro centro.",
		problem:
			"La confianza es lo que mueve a un paciente a pedir cita. Sin una web que presente a tu equipo y explique tus servicios, compites solo por precio o por cercanía, no por la calidad que ofreces.",
		solution:
			"Montamos una web cercana y profesional con tus servicios, la presentación de tu equipo, formulario de contacto, WhatsApp y ubicación. Todo orientado a que el nuevo paciente confíe y pida cita.",
		benefits: [
			{
				title: "Confianza desde el primer clic",
				description:
					"Presentación de tu equipo y tratamientos para que el paciente sepa en buenas manos está antes de llamar.",
				icon: "ShieldCheck",
			},
			{
				title: "Servicios claros",
				description:
					"Una página que explica qué tratáis y cómo, resolviendo las dudas habituales del paciente.",
				icon: "FileText",
			},
			{
				title: "Pedir cita es inmediato",
				description:
					"Formulario de contacto y WhatsApp para que solicitar cita sea fácil desde cualquier dispositivo.",
				icon: "CalendarCheck",
			},
		],
		keywords: [
			"web para clínica",
			"web para fisioterapia",
			"web para psicólogos",
			"web para dentistas",
		],
		faqs: [
			{
				question: "¿Puedo presentar a todo mi equipo?",
				answer:
					"Sí. El pack incluye una sección para presentar a los profesionales de la clínica con foto y especialidad.",
			},
			{
				question: "¿Se pueden pedir citas desde la web?",
				answer:
					"Incluye formulario de contacto y WhatsApp. Si quieres un sistema de citas con calendario, lo añadimos como extra.",
			},
			{
				question: "¿Cumple con la imagen seria que necesita una clínica?",
				answer:
					"Sí. Cuidamos un diseño profesional y cercano, adaptado al tono que necesita el sector salud.",
			},
		],
	},
];

export interface PackExtra {
	slug: string;
	title: string;
	install: string;
	monthly: string;
	installAmount: number;
	monthlyAmount: number;
	description: string;
}

/** Plan base común a todos los packs (instalación + mantenimiento). */
export const basePlan = {
	install: {
		price: "200€",
		amount: 200,
		features: [
			"Diseño profesional personalizado",
			"Hasta 5 secciones",
			"Diseño responsive",
			"Formulario de contacto",
			"Botón de WhatsApp",
			"Google Maps",
			"Dominio incluido",
			"SSL",
			"Publicación online",
		],
	},
	maintenance: {
		price: "20€/mes",
		amount: 20,
		badge: "Más barato que un café al día",
		features: [
			"Hosting",
			"Renovación del dominio",
			"Monitorización",
			"Copias de seguridad",
			"Actualizaciones de seguridad",
			"Soporte técnico",
			"Hasta 15 minutos de cambios al mes",
		],
	},
};

/** Extras opcionales que se pueden añadir a cualquier pack o al plan base. */
export const extras: PackExtra[] = [
	{
		slug: "booksy",
		title: "Integración Booksy",
		install: "+50€ instalación",
		monthly: "+5€/mes",
		installAmount: 50,
		monthlyAmount: 5,
		description: "Permite que los clientes reserven directamente desde tu web.",
	},
	{
		slug: "cal-com",
		title: "Integración Cal.com",
		install: "+50€ instalación",
		monthly: "+5€/mes",
		installAmount: 50,
		monthlyAmount: 5,
		description:
			"Conecta tu calendario para que los clientes puedan reservar huecos disponibles.",
	},
	{
		slug: "instagram",
		title: "Instagram",
		install: "+30€ instalación",
		monthly: "+3€/mes",
		installAmount: 30,
		monthlyAmount: 3,
		description: "Mostrar publicaciones directamente en tu web.",
	},
	{
		slug: "tiktok",
		title: "TikTok",
		install: "+30€ instalación",
		monthly: "+3€/mes",
		installAmount: 30,
		monthlyAmount: 3,
		description:
			"Integra tu contenido social para reforzar confianza y actividad.",
	},
	{
		slug: "galeria-avanzada",
		title: "Galería de trabajos avanzada",
		install: "+50€ instalación",
		monthly: "+3€/mes",
		installAmount: 50,
		monthlyAmount: 3,
		description:
			"Muestra servicios, resultados, antes y después o trabajos destacados.",
	},
	{
		slug: "blog",
		title: "Blog autogestionable",
		install: "+100€ instalación",
		monthly: "+5€/mes",
		installAmount: 100,
		monthlyAmount: 5,
		description:
			"Publica novedades, consejos o contenidos locales sin depender de desarrollo.",
	},
	{
		slug: "seo-local",
		title: "SEO Local",
		install: "+100€ instalación",
		monthly: "+10€/mes",
		installAmount: 100,
		monthlyAmount: 10,
		description:
			"Optimización para aparecer mejor en Google Maps y búsquedas locales.",
	},
	{
		slug: "correo",
		title: "Correo corporativo",
		install: "+50€ instalación",
		monthly: "+5€/mes",
		installAmount: 50,
		monthlyAmount: 5,
		description: "Ejemplos: info@tuempresa.es o reservas@tuempresa.es.",
	},
	{
		slug: "formularios-avanzados",
		title: "Formularios avanzados",
		install: "+50€ instalación",
		monthly: "+5€/mes",
		installAmount: 50,
		monthlyAmount: 5,
		description:
			"Solicitudes con más campos, filtros, avisos y flujos de contacto adaptados.",
	},
	{
		slug: "whatsapp-auto",
		title: "Recepción automática por WhatsApp",
		install: "+100€ instalación",
		monthly: "+10€/mes",
		installAmount: 100,
		monthlyAmount: 10,
		description:
			"Automatiza el primer mensaje y ordena mejor las solicitudes entrantes.",
	},
	{
		slug: "chat-ia",
		title: "Chat IA",
		install: "+200€ instalación",
		monthly: "+15€/mes",
		installAmount: 200,
		monthlyAmount: 15,
		description:
			"Responde automáticamente a preguntas frecuentes de los clientes.",
	},
	{
		slug: "reservas",
		title: "Sistema de reservas propio",
		install: "+300€ instalación",
		monthly: "+15€/mes",
		installAmount: 300,
		monthlyAmount: 15,
		description:
			"Reserva citas directamente en tu web con un flujo propio y controlado.",
	},
];

/** Devuelve un pack por su slug, o undefined si no existe. */
export function getPack(slug: string): Pack | undefined {
	return packs.find((pack) => pack.slug === slug);
}

export interface PackPricing {
	/** Precio del pack (base + extras, con descuento ya aplicado). */
	installAmount: number;
	monthlyAmount: number;
	/** Coste de contratar el plan base + los mismos extras por separado. */
	alaCarteInstall: number;
	alaCarteMonthly: number;
	/** Ahorro del pack frente a comprar el base + extras por separado. */
	savingsInstall: number;
	savingsMonthly: number;
}

/**
 * Calcula el ahorro de un pack frente a contratar el plan base y sus extras
 * por separado. El precio del pack siempre es menor que la suma à la carte.
 */
export function getPackPricing(pack: Pack): PackPricing {
	const bundled = pack.bundledExtras
		.map((slug) => extras.find((extra) => extra.slug === slug))
		.filter((extra): extra is PackExtra => Boolean(extra));

	const alaCarteInstall =
		basePlan.install.amount +
		bundled.reduce((sum, extra) => sum + extra.installAmount, 0);
	const alaCarteMonthly =
		basePlan.maintenance.amount +
		bundled.reduce((sum, extra) => sum + extra.monthlyAmount, 0);

	return {
		installAmount: pack.installAmount,
		monthlyAmount: pack.monthlyAmount,
		alaCarteInstall,
		alaCarteMonthly,
		savingsInstall: Math.max(0, alaCarteInstall - pack.installAmount),
		savingsMonthly: Math.max(0, alaCarteMonthly - pack.monthlyAmount),
	};
}
