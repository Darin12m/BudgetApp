import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const NotFound = () => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md glassmorphic-card text-center"
      >
        <CardHeader>
          <CardTitle className="text-4xl font-bold mb-4 tracking-tight">{t("notFound.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl text-muted-foreground mb-4">{t("notFound.pageNotFound")}</p>
          <a href="/" className="text-primary hover:underline">
            {t("common.returnToHome")}
          </a>
        </CardContent>
      </motion.div>
    </div>
  );
};

export default NotFound;