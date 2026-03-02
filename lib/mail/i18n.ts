export type Locale = "fr" | "en" | "es" | "de" | "it";

export interface EmailTranslations {
  locale: Locale;

  // Layout
  footer_tagline: string;

  // Subjects (plain UTF-8, no HTML entities)
  subject_order_confirmation: string;
  subject_shipping: string;
  subject_billing_reminder: string;
  subject_payment_failed: string;
  subject_refund: string;
  subject_subscription_confirmation: string;

  // Common
  greeting: string;
  order_ref: string;

  // Order confirmation
  order_badge: string;
  order_thanks: string;
  order_body: string;
  order_summary: string;
  order_quantity: string;
  order_shipping: string;
  order_shipping_free: string;
  order_total: string;
  order_cta: string;

  // Shipping notification
  shipping_badge: string;
  shipping_headline: string;
  shipping_title: string;
  shipping_body: string;
  shipping_tracking: string;
  shipping_cta: string;
  shipping_download_label: string;

  // Billing reminder
  billing_badge: string;
  billing_body: string;
  billing_auto: string;
  billing_skip: string;
  billing_cta: string;
  billing_closing: string;
  billing_team: string;

  // Payment failed
  payment_badge: string;
  payment_body: string;
  payment_reassure: string;
  payment_action: string;
  payment_cta: string;
  payment_card_expired: string;
  payment_update_card: string;
  payment_error_contact: string;

  // Subscription confirmation
  sub_badge: string;
  sub_welcome: string;
  sub_body: string;
  sub_summary: string;
  sub_shipping: string;
  sub_shipping_free: string;
  sub_total_quarter: string;
  sub_schedule_title: string;
  sub_skip: string;
  sub_cta: string;
  sub_closing: string;
  sub_team: string;

  // Refund confirmation
  refund_badge: string;
  refund_title: string;
  refund_body: string;
  refund_detail: string;
  refund_amount: string;
  refund_contact: string;
  refund_cta: string;
}

const fr: EmailTranslations = {
  locale: "fr",
  footer_tagline: "Cr&eacute;ateur d'imaginaires",

  subject_order_confirmation:
    "Confirmation de commande TSK-{orderId} - Tsuky Tales",
  subject_shipping: "Votre commande TSK-{orderId} est en route !",
  subject_billing_reminder:
    "Rappel : votre prochaine box Tsuky Tales le {date}",
  subject_payment_failed:
    "Probl\u00e8me de paiement pour votre abonnement Tsuky Tales",
  subject_refund: "Remboursement de votre commande TSK-{orderId} - Tsuky Tales",
  subject_subscription_confirmation:
    "Bienvenue dans votre abonnement Tsuky Tales !",

  greeting: "Bonjour",
  order_ref: "Commande",

  order_badge: "Confirmation",
  order_thanks: "Merci pour votre confiance !",
  order_body:
    "Nous avons bien re&ccedil;u votre commande. Notre &eacute;quipe s'affaire d&eacute;j&agrave; &agrave; pr&eacute;parer vos pr&eacute;cieux livres avec tout le soin qu'ils m&eacute;ritent.",
  order_summary: "R&eacute;capitulatif",
  order_quantity: "Quantit&eacute;",
  order_shipping: "Livraison",
  order_shipping_free: "Offerte",
  order_total: "Total",
  order_cta: "Suivre ma commande",

  shipping_badge: "Exp&eacute;dition",
  shipping_headline: "TSUKY EN ROUTE !",
  shipping_title: "Votre colis a d&eacute;coll&eacute; !",
  shipping_body:
    "Bonne nouvelle ! Votre commande a &eacute;t&eacute; remise &agrave; notre transporteur partenaire et entame son voyage vers vous.",
  shipping_tracking: "Num&eacute;ro de suivi",
  shipping_cta: "Suivre ma commande",
  shipping_download_label: "T&eacute;l&eacute;charger mon &eacute;tiquette",

  sub_badge: "Abonnement",
  sub_welcome:
    "Votre abonnement Tsuky Tales a bien &eacute;t&eacute; cr&eacute;&eacute; !",
  sub_body:
    "Aucun pr&eacute;l&egrave;vement n'a &eacute;t&eacute; effectu&eacute; pour le moment. Votre moyen de paiement sera d&eacute;bit&eacute; automatiquement &agrave; chaque date pr&eacute;vue ci-dessous.",
  sub_summary: "Votre abonnement",
  sub_shipping: "Livraison",
  sub_shipping_free: "Offerte",
  sub_total_quarter: "Total / trimestre",
  sub_schedule_title: "&Eacute;ch&eacute;ances de paiement",
  sub_skip:
    "Vous pouvez passer un envoi depuis votre espace personnel jusqu'&agrave; 24h avant la date pr&eacute;vue.",
  sub_cta: "G&eacute;rer mon abonnement",
  sub_closing: "&Agrave; tr&egrave;s bient&ocirc;t !",
  sub_team: "L'&eacute;quipe Tsuky Tales",

  billing_badge: "Rappel",
  billing_body:
    "Votre prochain envoi Tsuky Tales est pr&eacute;vu pour le <strong>{date}</strong>.",
  billing_auto:
    "Le pr&eacute;l&egrave;vement sera effectu&eacute; automatiquement.",
  billing_skip:
    "Si vous souhaitez passer cet envoi, vous pouvez le faire depuis votre espace personnel jusqu'&agrave; 24h avant la date.",
  billing_cta: "G&eacute;rer mon abonnement",
  billing_closing: "&Agrave; bient&ocirc;t !",
  billing_team: "L'&eacute;quipe Tsuky Tales",

  payment_badge: "Paiement",
  payment_body:
    "Nous n'avons pas pu traiter le paiement de votre abonnement Tsuky Tales.",
  payment_reassure:
    "<strong>Pas d'inqui&eacute;tude, cela peut arriver !</strong>",
  payment_action:
    "Il vous suffit de mettre &agrave; jour vos informations de paiement pour continuer &agrave; recevoir vos box.",
  payment_cta: "R&eacute;gulariser mon paiement",
  payment_card_expired:
    "Si votre carte a expir&eacute;, vous pouvez mettre &agrave; jour votre moyen de paiement depuis votre espace client.",
  payment_update_card: "Mettre &agrave; jour ma CB",
  payment_error_contact:
    "Si vous pensez qu'il s'agit d'une erreur, n'h&eacute;sitez pas &agrave; nous contacter.",

  refund_badge: "Remboursement",
  refund_title: "Votre remboursement a &eacute;t&eacute; effectu&eacute;",
  refund_body:
    "Nous vous confirmons le remboursement de votre commande. Le montant sera cr&eacute;dit&eacute; sur votre moyen de paiement d'origine sous quelques jours ouvrables.",
  refund_detail: "D&eacute;tail",
  refund_amount: "Montant rembours&eacute;",
  refund_contact:
    "Si vous avez des questions, n'h&eacute;sitez pas &agrave; nous contacter.",
  refund_cta: "Mon espace client",
};

const en: EmailTranslations = {
  locale: "en",
  footer_tagline: "Creator of imaginary worlds",

  subject_order_confirmation: "Order confirmation TSK-{orderId} - Tsuky Tales",
  subject_shipping: "Your order TSK-{orderId} is on its way!",
  subject_billing_reminder: "Reminder: your next Tsuky Tales box on {date}",
  subject_payment_failed: "Payment issue with your Tsuky Tales subscription",
  subject_refund: "Refund for your order TSK-{orderId} - Tsuky Tales",
  subject_subscription_confirmation:
    "Welcome to your Tsuky Tales subscription!",

  greeting: "Hello",
  order_ref: "Order",

  order_badge: "Confirmation",
  order_thanks: "Thank you for your trust!",
  order_body:
    "We have received your order. Our team is already busy preparing your precious books with all the care they deserve.",
  order_summary: "Summary",
  order_quantity: "Quantity",
  order_shipping: "Shipping",
  order_shipping_free: "Free",
  order_total: "Total",
  order_cta: "Track my order",

  shipping_badge: "Shipping",
  shipping_headline: "TSUKY ON THE WAY!",
  shipping_title: "Your package has shipped!",
  shipping_body:
    "Great news! Your order has been handed over to our shipping partner and is on its way to you.",
  shipping_tracking: "Tracking number",
  shipping_cta: "Track my order",
  shipping_download_label: "Download my label",

  sub_badge: "Subscription",
  sub_welcome: "Your Tsuky Tales subscription has been created!",
  sub_body:
    "No payment has been charged yet. Your payment method will be automatically debited on each scheduled date below.",
  sub_summary: "Your subscription",
  sub_shipping: "Shipping",
  sub_shipping_free: "Free",
  sub_total_quarter: "Total / quarter",
  sub_schedule_title: "Payment schedule",
  sub_skip:
    "You can skip a shipment from your account up to 24 hours before the scheduled date.",
  sub_cta: "Manage my subscription",
  sub_closing: "See you soon!",
  sub_team: "The Tsuky Tales Team",

  billing_badge: "Reminder",
  billing_body:
    "Your next Tsuky Tales shipment is scheduled for <strong>{date}</strong>.",
  billing_auto: "Payment will be processed automatically.",
  billing_skip:
    "If you would like to skip this shipment, you can do so from your account up to 24 hours before the date.",
  billing_cta: "Manage my subscription",
  billing_closing: "See you soon!",
  billing_team: "The Tsuky Tales Team",

  payment_badge: "Payment",
  payment_body:
    "We were unable to process the payment for your Tsuky Tales subscription.",
  payment_reassure: "<strong>Don&rsquo;t worry, it happens!</strong>",
  payment_action:
    "Simply update your payment information to continue receiving your boxes.",
  payment_cta: "Resolve my payment",
  payment_card_expired:
    "If your card has expired, you can update your payment method from your account.",
  payment_update_card: "Update my card",
  payment_error_contact:
    "If you think this is an error, please don&rsquo;t hesitate to contact us.",

  refund_badge: "Refund",
  refund_title: "Your refund has been processed",
  refund_body:
    "We confirm the refund of your order. The amount will be credited to your original payment method within a few business days.",
  refund_detail: "Details",
  refund_amount: "Refunded amount",
  refund_contact:
    "If you have any questions, please don&rsquo;t hesitate to contact us.",
  refund_cta: "My account",
};

const es: EmailTranslations = {
  locale: "es",
  footer_tagline: "Creador de mundos imaginarios",

  subject_order_confirmation:
    "Confirmaci\u00f3n de pedido TSK-{orderId} - Tsuky Tales",
  subject_shipping: "\u00a1Tu pedido TSK-{orderId} est\u00e1 en camino!",
  subject_billing_reminder:
    "Recordatorio: tu pr\u00f3xima caja Tsuky Tales el {date}",
  subject_payment_failed:
    "Problema de pago con tu suscripci\u00f3n Tsuky Tales",
  subject_refund: "Reembolso de tu pedido TSK-{orderId} - Tsuky Tales",
  subject_subscription_confirmation:
    "\u00a1Bienvenido/a a tu suscripci\u00f3n Tsuky Tales!",

  greeting: "Hola",
  order_ref: "Pedido",

  order_badge: "Confirmaci&oacute;n",
  order_thanks: "&iexcl;Gracias por tu confianza!",
  order_body:
    "Hemos recibido tu pedido. Nuestro equipo ya est&aacute; preparando tus preciados libros con todo el cuidado que merecen.",
  order_summary: "Resumen",
  order_quantity: "Cantidad",
  order_shipping: "Env&iacute;o",
  order_shipping_free: "Gratis",
  order_total: "Total",
  order_cta: "Seguir mi pedido",

  shipping_badge: "Env&iacute;o",
  shipping_headline: "&iexcl;TSUKY EN CAMINO!",
  shipping_title: "&iexcl;Tu paquete ha sido enviado!",
  shipping_body:
    "&iexcl;Buenas noticias! Tu pedido ha sido entregado a nuestro transportista y est&aacute; en camino hacia ti.",
  shipping_tracking: "N&uacute;mero de seguimiento",
  shipping_cta: "Seguir mi pedido",
  shipping_download_label: "Descargar mi etiqueta",

  sub_badge: "Suscripci&oacute;n",
  sub_welcome: "&iexcl;Tu suscripci&oacute;n Tsuky Tales ha sido creada!",
  sub_body:
    "No se ha realizado ning&uacute;n cobro por el momento. Tu m&eacute;todo de pago se cargar&aacute; autom&aacute;ticamente en cada fecha prevista a continuaci&oacute;n.",
  sub_summary: "Tu suscripci&oacute;n",
  sub_shipping: "Env&iacute;o",
  sub_shipping_free: "Gratis",
  sub_total_quarter: "Total / trimestre",
  sub_schedule_title: "Calendario de pagos",
  sub_skip:
    "Puedes omitir un env&iacute;o desde tu cuenta hasta 24 horas antes de la fecha prevista.",
  sub_cta: "Gestionar mi suscripci&oacute;n",
  sub_closing: "&iexcl;Hasta pronto!",
  sub_team: "El equipo de Tsuky Tales",

  billing_badge: "Recordatorio",
  billing_body:
    "Tu pr&oacute;ximo env&iacute;o de Tsuky Tales est&aacute; previsto para el <strong>{date}</strong>.",
  billing_auto: "El cobro se realizar&aacute; autom&aacute;ticamente.",
  billing_skip:
    "Si deseas omitir este env&iacute;o, puedes hacerlo desde tu cuenta hasta 24 horas antes de la fecha.",
  billing_cta: "Gestionar mi suscripci&oacute;n",
  billing_closing: "&iexcl;Hasta pronto!",
  billing_team: "El equipo de Tsuky Tales",

  payment_badge: "Pago",
  payment_body:
    "No hemos podido procesar el pago de tu suscripci&oacute;n Tsuky Tales.",
  payment_reassure: "<strong>&iexcl;No te preocupes, puede pasar!</strong>",
  payment_action:
    "Solo tienes que actualizar tu informaci&oacute;n de pago para seguir recibiendo tus cajas.",
  payment_cta: "Regularizar mi pago",
  payment_card_expired:
    "Si tu tarjeta ha caducado, puedes actualizar tu m&eacute;todo de pago desde tu cuenta.",
  payment_update_card: "Actualizar mi tarjeta",
  payment_error_contact:
    "Si crees que se trata de un error, no dudes en contactarnos.",

  refund_badge: "Reembolso",
  refund_title: "Tu reembolso ha sido procesado",
  refund_body:
    "Confirmamos el reembolso de tu pedido. El importe ser&aacute; abonado en tu m&eacute;todo de pago original en unos d&iacute;as h&aacute;biles.",
  refund_detail: "Detalle",
  refund_amount: "Importe reembolsado",
  refund_contact: "Si tienes alguna pregunta, no dudes en contactarnos.",
  refund_cta: "Mi cuenta",
};

const de: EmailTranslations = {
  locale: "de",
  footer_tagline: "Sch&ouml;pfer imagin&auml;rer Welten",

  subject_order_confirmation:
    "Bestellbest\u00e4tigung TSK-{orderId} - Tsuky Tales",
  subject_shipping: "Ihre Bestellung TSK-{orderId} ist unterwegs!",
  subject_billing_reminder:
    "Erinnerung: Ihre n\u00e4chste Tsuky Tales Box am {date}",
  subject_payment_failed: "Zahlungsproblem mit Ihrem Tsuky Tales Abonnement",
  subject_refund:
    "R\u00fcckerstattung Ihrer Bestellung TSK-{orderId} - Tsuky Tales",
  subject_subscription_confirmation:
    "Willkommen bei Ihrem Tsuky Tales Abonnement!",

  greeting: "Hallo",
  order_ref: "Bestellung",

  order_badge: "Best&auml;tigung",
  order_thanks: "Vielen Dank f&uuml;r Ihr Vertrauen!",
  order_body:
    "Wir haben Ihre Bestellung erhalten. Unser Team bereitet Ihre wertvollen B&uuml;cher bereits mit aller Sorgfalt vor.",
  order_summary: "&Uuml;bersicht",
  order_quantity: "Menge",
  order_shipping: "Versand",
  order_shipping_free: "Kostenlos",
  order_total: "Gesamt",
  order_cta: "Meine Bestellung verfolgen",

  shipping_badge: "Versand",
  shipping_headline: "TSUKY UNTERWEGS!",
  shipping_title: "Ihr Paket ist unterwegs!",
  shipping_body:
    "Gute Nachrichten! Ihre Bestellung wurde an unseren Versandpartner &uuml;bergeben und ist auf dem Weg zu Ihnen.",
  shipping_tracking: "Sendungsnummer",
  shipping_cta: "Meine Bestellung verfolgen",
  shipping_download_label: "Mein Etikett herunterladen",

  sub_badge: "Abonnement",
  sub_welcome: "Ihr Tsuky Tales Abonnement wurde erfolgreich erstellt!",
  sub_body:
    "Es wurde noch keine Zahlung abgebucht. Ihr Zahlungsmittel wird automatisch zu jedem unten aufgef&uuml;hrten Termin belastet.",
  sub_summary: "Ihr Abonnement",
  sub_shipping: "Versand",
  sub_shipping_free: "Kostenlos",
  sub_total_quarter: "Gesamt / Quartal",
  sub_schedule_title: "Zahlungsplan",
  sub_skip:
    "Sie k&ouml;nnen eine Lieferung bis 24 Stunden vor dem geplanten Datum in Ihrem Konto &uuml;berspringen.",
  sub_cta: "Mein Abonnement verwalten",
  sub_closing: "Bis bald!",
  sub_team: "Das Tsuky Tales Team",

  billing_badge: "Erinnerung",
  billing_body:
    "Ihre n&auml;chste Tsuky Tales Lieferung ist f&uuml;r den <strong>{date}</strong> geplant.",
  billing_auto: "Die Zahlung wird automatisch abgebucht.",
  billing_skip:
    "Wenn Sie diese Lieferung &uuml;berspringen m&ouml;chten, k&ouml;nnen Sie dies bis 24 Stunden vor dem Datum in Ihrem Konto tun.",
  billing_cta: "Mein Abonnement verwalten",
  billing_closing: "Bis bald!",
  billing_team: "Das Tsuky Tales Team",

  payment_badge: "Zahlung",
  payment_body:
    "Wir konnten die Zahlung f&uuml;r Ihr Tsuky Tales Abonnement nicht verarbeiten.",
  payment_reassure: "<strong>Keine Sorge, das kann passieren!</strong>",
  payment_action:
    "Aktualisieren Sie einfach Ihre Zahlungsinformationen, um weiterhin Ihre Boxen zu erhalten.",
  payment_cta: "Zahlung begleichen",
  payment_card_expired:
    "Falls Ihre Karte abgelaufen ist, k&ouml;nnen Sie Ihre Zahlungsmethode in Ihrem Kundenkonto aktualisieren.",
  payment_update_card: "Karte aktualisieren",
  payment_error_contact:
    "Wenn Sie glauben, dass es sich um einen Fehler handelt, z&ouml;gern Sie nicht, uns zu kontaktieren.",

  refund_badge: "R&uuml;ckerstattung",
  refund_title: "Ihre R&uuml;ckerstattung wurde veranlasst",
  refund_body:
    "Wir best&auml;tigen die R&uuml;ckerstattung Ihrer Bestellung. Der Betrag wird innerhalb weniger Werktage auf Ihr urspr&uuml;ngliches Zahlungsmittel gutgeschrieben.",
  refund_detail: "Details",
  refund_amount: "Erstatteter Betrag",
  refund_contact: "Bei Fragen z&ouml;gern Sie nicht, uns zu kontaktieren.",
  refund_cta: "Mein Kundenkonto",
};

const it: EmailTranslations = {
  locale: "it",
  footer_tagline: "Creatore di mondi immaginari",

  subject_order_confirmation: "Conferma ordine TSK-{orderId} - Tsuky Tales",
  subject_shipping: "Il tuo ordine TSK-{orderId} \u00e8 in viaggio!",
  subject_billing_reminder:
    "Promemoria: la tua prossima box Tsuky Tales il {date}",
  subject_payment_failed:
    "Problema di pagamento con il tuo abbonamento Tsuky Tales",
  subject_refund: "Rimborso del tuo ordine TSK-{orderId} - Tsuky Tales",
  subject_subscription_confirmation:
    "Benvenuto/a nel tuo abbonamento Tsuky Tales!",

  greeting: "Ciao",
  order_ref: "Ordine",

  order_badge: "Conferma",
  order_thanks: "Grazie per la tua fiducia!",
  order_body:
    "Abbiamo ricevuto il tuo ordine. Il nostro team sta gi&agrave; preparando i tuoi preziosi libri con tutta la cura che meritano.",
  order_summary: "Riepilogo",
  order_quantity: "Quantit&agrave;",
  order_shipping: "Spedizione",
  order_shipping_free: "Gratuita",
  order_total: "Totale",
  order_cta: "Segui il mio ordine",

  shipping_badge: "Spedizione",
  shipping_headline: "TSUKY IN VIAGGIO!",
  shipping_title: "Il tuo pacco &egrave; stato spedito!",
  shipping_body:
    "Ottime notizie! Il tuo ordine &egrave; stato affidato al nostro corriere partner e sta viaggiando verso di te.",
  shipping_tracking: "Numero di tracciamento",
  shipping_cta: "Segui il mio ordine",
  shipping_download_label: "Scarica la mia etichetta",

  sub_badge: "Abbonamento",
  sub_welcome: "Il tuo abbonamento Tsuky Tales &egrave; stato creato!",
  sub_body:
    "Nessun addebito &egrave; stato effettuato per il momento. Il tuo metodo di pagamento verr&agrave; addebitato automaticamente ad ogni data prevista qui sotto.",
  sub_summary: "Il tuo abbonamento",
  sub_shipping: "Spedizione",
  sub_shipping_free: "Gratuita",
  sub_total_quarter: "Totale / trimestre",
  sub_schedule_title: "Scadenze di pagamento",
  sub_skip:
    "Puoi saltare un invio dal tuo account fino a 24 ore prima della data prevista.",
  sub_cta: "Gestire il mio abbonamento",
  sub_closing: "A presto!",
  sub_team: "Il team Tsuky Tales",

  billing_badge: "Promemoria",
  billing_body:
    "Il tuo prossimo invio Tsuky Tales &egrave; previsto per il <strong>{date}</strong>.",
  billing_auto: "Il pagamento verr&agrave; addebitato automaticamente.",
  billing_skip:
    "Se desideri saltare questo invio, puoi farlo dal tuo account fino a 24 ore prima della data.",
  billing_cta: "Gestire il mio abbonamento",
  billing_closing: "A presto!",
  billing_team: "Il team Tsuky Tales",

  payment_badge: "Pagamento",
  payment_body:
    "Non siamo riusciti a elaborare il pagamento del tuo abbonamento Tsuky Tales.",
  payment_reassure: "<strong>Non preoccuparti, pu&ograve; capitare!</strong>",
  payment_action:
    "Basta aggiornare le tue informazioni di pagamento per continuare a ricevere le tue box.",
  payment_cta: "Regolarizzare il pagamento",
  payment_card_expired:
    "Se la tua carta &egrave; scaduta, puoi aggiornare il metodo di pagamento dal tuo account.",
  payment_update_card: "Aggiornare la mia carta",
  payment_error_contact:
    "Se pensi che si tratti di un errore, non esitare a contattarci.",

  refund_badge: "Rimborso",
  refund_title: "Il tuo rimborso &egrave; stato effettuato",
  refund_body:
    "Confermiamo il rimborso del tuo ordine. L'importo verr&agrave; accreditato sul tuo metodo di pagamento originale entro pochi giorni lavorativi.",
  refund_detail: "Dettaglio",
  refund_amount: "Importo rimborsato",
  refund_contact: "Se hai domande, non esitare a contattarci.",
  refund_cta: "Il mio account",
};

const translations: Record<Locale, EmailTranslations> = { fr, en, es, de, it };

const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  FR: "fr",
  ES: "es",
  DE: "de",
  AT: "de",
  IT: "it",
};

export function countryToLocale(country: string): Locale {
  return COUNTRY_TO_LOCALE[country.toUpperCase()] || "en";
}

export function getEmailT(country: string): EmailTranslations {
  return translations[countryToLocale(country)];
}

const DATE_LOCALES: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
};

export function getDateLocale(country: string): string {
  return DATE_LOCALES[countryToLocale(country)];
}
