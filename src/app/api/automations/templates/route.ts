import { NextResponse } from "next/server";

// Templates d'automatisations prédéfinis
const AUTOMATION_TEMPLATES = [
  {
    id: "welcome_new_donor",
    name: "Bienvenue nouveau donateur",
    description: "Envoie un email de bienvenue après le premier don d'un donateur",
    category: "onboarding",
    icon: "👋",
    triggerType: "NEW_DONOR",
    triggerConfig: {},
    actions: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        config: {
          subject: "Bienvenue dans notre communauté, {{firstName}} !",
          body: `<h1>Merci pour votre premier don, {{firstName}} !</h1>
<p>Votre générosité fait une réelle différence. Grâce à vous, nous pouvons continuer notre mission.</p>
<p>Voici ce que votre don permet de réaliser :</p>
<ul>
  <li>Impact concret 1</li>
  <li>Impact concret 2</li>
  <li>Impact concret 3</li>
</ul>
<p>Nous vous tiendrons informé(e) de l'avancement de nos projets.</p>
<p>Encore merci,<br>L'équipe</p>`,
        },
      },
      {
        order: 2,
        actionType: "ADD_TAG",
        config: {
          tag: "nouveau_donateur",
        },
      },
    ],
  },
  {
    id: "post_donation_thank_you",
    name: "Remerciement post-don",
    description: "Envoie un email de remerciement personnalisé après chaque don",
    category: "engagement",
    icon: "💝",
    triggerType: "POST_DONATION",
    triggerConfig: {},
    actions: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        config: {
          subject: "Merci pour votre don, {{firstName}} !",
          body: `<h1>Merci infiniment, {{firstName}} !</h1>
<p>Votre don vient d'être reçu et nous en sommes très reconnaissants.</p>
<p>Votre soutien nous permet de poursuivre notre mission et d'avoir un impact réel.</p>
<p>Un reçu fiscal vous sera envoyé séparément.</p>
<p>Avec toute notre gratitude,<br>L'équipe</p>`,
        },
      },
    ],
  },
  {
    id: "donation_anniversary",
    name: "Anniversaire de don",
    description: "Célèbre l'anniversaire du premier don (1 an après)",
    category: "retention",
    icon: "🎂",
    triggerType: "DONATION_ANNIVERSARY",
    triggerConfig: {},
    actions: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        config: {
          subject: "Un an déjà, {{firstName}} ! 🎉",
          body: `<h1>Joyeux anniversaire de don, {{firstName}} !</h1>
<p>Il y a exactement un an, vous avez fait votre premier don. Depuis, grâce à vous et à notre communauté, nous avons accompli tant de choses.</p>
<p><strong>Votre impact cette année :</strong></p>
<ul>
  <li>Réalisation 1</li>
  <li>Réalisation 2</li>
  <li>Réalisation 3</li>
</ul>
<p>Voulez-vous continuer à faire la différence ?</p>
<p><a href="#">Faire un don aujourd'hui</a></p>
<p>Merci de faire partie de notre communauté,<br>L'équipe</p>`,
        },
      },
    ],
  },
  {
    id: "inactive_donor_reactivation",
    name: "Relance donateur inactif",
    description: "Relance les donateurs qui n'ont pas donné depuis 6 mois",
    category: "reactivation",
    icon: "🔄",
    triggerType: "INACTIVE_DONOR",
    triggerConfig: {
      inactiveDays: 180,
    },
    actions: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        config: {
          subject: "{{firstName}}, vous nous manquez !",
          body: `<h1>Bonjour {{firstName}},</h1>
<p>Cela fait un moment que nous n'avons pas eu de vos nouvelles, et nous voulions simplement vous dire que vous nous manquez !</p>
<p>Depuis votre dernier don, nous avons continué à avancer grâce au soutien de notre communauté.</p>
<p><strong>Voici ce que nous avons accompli :</strong></p>
<ul>
  <li>Projet récent 1</li>
  <li>Projet récent 2</li>
</ul>
<p>Votre soutien, quel qu'il soit, fait une différence.</p>
<p><a href="#">Renouveler votre soutien</a></p>
<p>Avec reconnaissance,<br>L'équipe</p>`,
        },
      },
      {
        order: 2,
        actionType: "ADD_TAG",
        config: {
          tag: "relance_envoyee",
        },
      },
    ],
  },
  {
    id: "upgrade_to_recurring",
    name: "Proposition don récurrent",
    description: "Propose le don mensuel aux donateurs ayant fait 3+ dons ponctuels",
    category: "upgrade",
    icon: "⬆️",
    triggerType: "UPGRADE_OPPORTUNITY",
    triggerConfig: {
      minDonations: 3,
    },
    actions: [
      {
        order: 1,
        actionType: "WAIT",
        config: {
          days: 7,
        },
      },
      {
        order: 2,
        actionType: "SEND_EMAIL",
        config: {
          subject: "{{firstName}}, simplifiez votre générosité",
          body: `<h1>Merci pour votre fidélité, {{firstName}} !</h1>
<p>Vous avez déjà fait plusieurs dons et nous vous en sommes infiniment reconnaissants.</p>
<p><strong>Avez-vous pensé au don mensuel ?</strong></p>
<p>En devenant donateur mensuel, vous :</p>
<ul>
  <li>✅ Simplifiez votre générosité (plus besoin d'y penser)</li>
  <li>✅ Nous aidez à planifier nos actions sur le long terme</li>
  <li>✅ Rejoignez notre cercle de donateurs engagés</li>
</ul>
<p>Même un petit montant mensuel fait une grande différence.</p>
<p><a href="#">Devenir donateur mensuel</a></p>
<p>Merci de votre soutien continu,<br>L'équipe</p>`,
        },
      },
      {
        order: 3,
        actionType: "ADD_TAG",
        config: {
          tag: "proposition_recurrent",
        },
      },
    ],
  },
  {
    id: "donor_birthday",
    name: "Anniversaire du donateur",
    description: "Souhaite un joyeux anniversaire au donateur",
    category: "engagement",
    icon: "🎈",
    triggerType: "DONOR_BIRTHDAY",
    triggerConfig: {},
    actions: [
      {
        order: 1,
        actionType: "SEND_EMAIL",
        config: {
          subject: "Joyeux anniversaire, {{firstName}} ! 🎂",
          body: `<h1>Joyeux anniversaire, {{firstName}} !</h1>
<p>Toute l'équipe vous souhaite une merveilleuse journée remplie de joie et de bonheur.</p>
<p>Merci de faire partie de notre communauté de donateurs. Votre soutien compte énormément pour nous.</p>
<p>Passez une excellente journée !<br>L'équipe</p>`,
        },
      },
    ],
  },
  {
    id: "campaign_goal_reached",
    name: "Objectif de campagne atteint",
    description: "Notifie l'équipe quand une campagne atteint son objectif",
    category: "notification",
    icon: "🎯",
    triggerType: "CAMPAIGN_GOAL_REACHED",
    triggerConfig: {},
    actions: [
      {
        order: 1,
        actionType: "NOTIFY_TEAM",
        config: {
          message: "🎉 La campagne a atteint son objectif !",
          notifyOwner: true,
        },
      },
    ],
  },
  {
    id: "recurring_cancelled",
    name: "Don récurrent annulé",
    description: "Réagit quand un donateur annule son don récurrent",
    category: "retention",
    icon: "⚠️",
    triggerType: "RECURRING_CANCELLED",
    triggerConfig: {},
    actions: [
      {
        order: 1,
        actionType: "NOTIFY_TEAM",
        config: {
          message: "⚠️ {{fullName}} a annulé son don récurrent",
          notifyOwner: true,
        },
      },
      {
        order: 2,
        actionType: "WAIT",
        config: {
          days: 3,
        },
      },
      {
        order: 3,
        actionType: "SEND_EMAIL",
        config: {
          subject: "{{firstName}}, nous avons une question",
          body: `<h1>Bonjour {{firstName}},</h1>
<p>Nous avons remarqué que vous avez annulé votre don mensuel. Nous respectons totalement votre décision.</p>
<p>Si vous avez un moment, pourriez-vous nous dire pourquoi ? Votre retour nous aide à nous améliorer.</p>
<p>Si c'était une erreur ou si votre situation a changé, sachez que vous pouvez reprendre votre don à tout moment.</p>
<p>Merci pour tout le soutien que vous nous avez apporté,<br>L'équipe</p>`,
        },
      },
      {
        order: 4,
        actionType: "ADD_TAG",
        config: {
          tag: "recurrent_annule",
        },
      },
    ],
  },
];

// GET - Liste des templates
export async function GET() {
  const categories = [
    { id: "onboarding", name: "Accueil", description: "Accueillir les nouveaux donateurs" },
    { id: "engagement", name: "Engagement", description: "Maintenir la relation" },
    { id: "retention", name: "Rétention", description: "Fidéliser les donateurs" },
    { id: "reactivation", name: "Réactivation", description: "Relancer les donateurs inactifs" },
    { id: "upgrade", name: "Upgrade", description: "Augmenter l'engagement" },
    { id: "notification", name: "Notification", description: "Alerter l'équipe" },
  ];

  return NextResponse.json({
    templates: AUTOMATION_TEMPLATES,
    categories,
  });
}
