// components/NavAwareBanner.jsx

"use client";

import SeasonalBanner from "@/components/SeasonalBanner";
import useNavHeight from "@/lib/useNavHeight";

export default function NavAwareBanner(props) {
  const navH = useNavHeight("site-nav"); // make sure your <nav id="site-nav" />
   

  return <SeasonalBanner fixed offsetTop={navH} {...props} />;
}
