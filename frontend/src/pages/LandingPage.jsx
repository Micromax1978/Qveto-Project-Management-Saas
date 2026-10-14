import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ProductPreview from '../components/ProductPreview';
import ValueStrip from '../components/ValueStrip';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import CollaborationSection from '../components/CollaborationSection';
import AnalyticsSection from '../components/AnalyticsSection';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import ActionModal from '../components/ActionModal';

export default function LandingPage() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    actionType: 'signup',
  });

  const handleOpenAuth = (type = 'signup') => {
    let title = 'Get Started with TASKORA';
    if (type === 'login') {
      title = 'Log in to TASKORA';
    } else if (type === 'new-task') {
      title = 'Create a New Task';
    } else if (type.startsWith('feature-')) {
      title = 'TASKORA Capability Overview';
    } else if (type === 'docs') {
      title = 'TASKORA Documentation Hub';
    } else if (type === 'help') {
      title = 'TASKORA Help Center';
    } else if (type === 'privacy' || type === 'terms') {
      title = 'TASKORA Legal & Compliance';
    } else if (type === 'contact') {
      title = 'Contact TASKORA Support';
    }

    setModalState({
      isOpen: true,
      title,
      actionType: type,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* 1. Navigation Bar */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection onOpenAuth={handleOpenAuth} />

        {/* 3. Product Dashboard Preview */}
        <ProductPreview onOpenAuth={handleOpenAuth} />

        {/* 4. Value Proposition Strip */}
        <ValueStrip />

        {/* 5. Features Section */}
        <FeaturesSection onOpenAuth={handleOpenAuth} />

        {/* 6. How It Works */}
        <HowItWorks />

        {/* 7. Team Collaboration Section */}
        <CollaborationSection onOpenAuth={handleOpenAuth} />

        {/* 8. Productivity Analytics Section */}
        <AnalyticsSection />

        {/* 9. Final Call to Action */}
        <FinalCTA onOpenAuth={handleOpenAuth} />
      </main>

      {/* 10. Footer */}
      <Footer onOpenAuth={handleOpenAuth} />

      {/* Accessible Feedback Modal for all interactive touchpoints */}
      <ActionModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title={modalState.title}
        actionType={modalState.actionType}
      />
    </div>
  );
}
