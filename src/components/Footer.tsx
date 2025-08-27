import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Facebook, Instagram, Twitter, Snail as Snapchat, Youtube } from 'lucide-react';
import type { StoreSettings } from '../types/database';

interface FooterProps {
  storeSettings?: StoreSettings | null;
}

export default function Footer({ storeSettings }: FooterProps) {
  const socialLinks = [
    { url: storeSettings?.facebook_url, icon: Facebook, label: 'Facebook' },
    { url: storeSettings?.instagram_url, icon: Instagram, label: 'Instagram' },
    { url: storeSettings?.twitter_url, icon: Twitter, label: 'Twitter' },
    { url: storeSettings?.snapchat_url, icon: Snapchat, label: 'Snapchat' },
    { url: storeSettings?.tiktok_url, icon: Youtube, label: 'TikTok' },
  ].filter(link => link.url);

  return (
    <footer className="bg-secondary/5 backdrop-blur-md border-t border-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          {socialLinks.length > 0 && (
            <div className="flex gap-4 mb-4">
              {socialLinks.map((link, index) => (
                link.url && (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary/80 hover:text-accent transition-colors duration-300"
                    title={link.label}
                  >
                    <link.icon className="h-6 w-6" />
                  </a>
                )
              ))}
            </div>
          )}
          
          {/* === بداية الجزء المعدل === */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-white text-opacity-50 text-xs">
              Store developed by
            </p>
            <a 
              href="https://RehlatHadaf.online" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-opacity-80 underline hover:no-underline flex items-center gap-1.5 text-xs"
            >
              <Target className="text-red-500 h-4 w-4" />
              Rehlat Hadaf for Commercial Marketing
            </a>
          </div>
          {/* === نهاية الجزء المعدل === */}

          <Link
            to="/admin/login"
            className="text-secondary/0 hover:text-accent transition-colors duration-300 flex justify-center items-center"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
