// lib/servicesData.js

 const services = [
   {
     title: "Dog Walking",
     description: "Daily walks to keep your pup healthy and happy.",
     icon: "🐕",
     price: "30 min: $20, 1 hour: $32",
   },
   {
     title: "Pet Sitting",
     description: "Overnight or daytime care in the comfort of your home.",
     icon: "🛏️",
     price:
       "🐶 Dogs: $60/night (+$20 per extra dog)\n🐱 Cats: $42/night (+$8 per extra cat)",
   },
   {
     title: "Drop-In Visits",
     description:
       "Quick check-ins for feeding, water, playtime, and litter cleanup.",
     icon: "⏰",
     price:
       "🐶 Dogs:\nSingle: 15 min $20, 30 min $25, 1 hr $32\nTwo: 30 min $32, 1 hr $40\n\n🐱 Cats:\nSingle: 15 min $10, 30 min $20, 1 hr $30\nTwo: 15 min $20, 30 min $25, 1 hr $35",
   },
   {
     title: "Pet Care",
     description:
       "Loving, attentive care for all types of pets — from dogs and cats to birds and reptiles.",
     icon: "🐾🐶🐱🐦🦎",
     price: null,
     note: "View full care types and rates",
     link: "/#full-price-list",
   },
 ];


export default services;

export const serviceOptions = [
  {
    group: "🐶 Dog Services",
    options: [
      { label: "Dog Walking – 15 minutes", value: "Dog Walking - 15 min" },
      { label: "Dog Walking – 30 minutes", value: "Dog Walking - 30 min" },
      { label: "Dog Walking – 1 hour", value: "Dog Walking - 1 hr" },
      { label: "Drop-In Visit – 1 Dog", value: "Dog Drop-In - Single" },
      { label: "Drop-In Visit – 2 Dogs", value: "Dog Drop-In - Two" },
      { label: "Overnight Sitting – Dogs", value: "Dog Overnight" },
    ],
  },
  {
    group: "🐱 Cat Services",
    options: [
      { label: "Drop-In Visit – 1 Cat", value: "Cat Drop-In - Single" },
      { label: "Drop-In Visit – 2 Cats", value: "Cat Drop-In - Two" },
      { label: "Overnight Sitting – Cats", value: "Cat Overnight" },
    ],
  },
  {
    group: "Other",
    options: [{ label: "Other / Not Listed", value: "Other" }],
  },
];

