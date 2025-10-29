"use client";

import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button'; // Import Button

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
          <CardTitle className="h1 mb-4 tracking-tight">{t("notFound.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="h3 text-muted-foreground mb-4">{t("notFound.pageNotFound")}</p>
          <Button asChild className="mt-4">
            <a href="/">{t("common.returnToHome")}</a>
          </Button>
        </CardContent>
      </motion.div>
    </div>
  );
};

export default NotFound;