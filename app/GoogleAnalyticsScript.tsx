import Script from "next/script";

export const GoogleAnalyticsScript = () => {
  return (
    <>
      <Script
        id="google-tag-manager"
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-BYRESXN0R4"
      />
      <Script id="google-analytics">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-BYRESXN0R4');
       `}
      </Script>
    </>
  );
};
