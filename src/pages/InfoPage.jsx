import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, CheckCircle2, User, BookOpen, MapPin, Briefcase, Award, Send, Info, Star, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function InfoPage() {
  const location = useLocation();
  const path = location.pathname;

  const isAdmin = path.startsWith('/admin');
  const basePath = isAdmin ? '/admin' : '';
  const cleanPath = path.replace(/^\/admin/, '') || '/about';

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  const sidebarLinks = [
    { name: 'About ReviewSmart', path: `${basePath}/about` },
    { name: 'Our Team', path: `${basePath}/our-team` },
    { name: 'Staff Demographics', path: `${basePath}/staff-demographics` },
    { name: 'How to Pitch', path: `${basePath}/how-to-pitch` },
    { name: 'Contact Us', path: `${basePath}/contact` }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMessage) {
      setContactSuccess(true);
      setTimeout(() => {
        setContactSuccess(false);
        setContactName('');
        setContactEmail('');
        setContactMessage('');
      }, 3000);
    }
  };

  const renderContent = () => {
    switch (cleanPath) {
      case '/about':
        return (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div>
              <h1 className="font-serif font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight mb-4">
                About ReviewSmart
              </h1>
              <p className="font-serif text-lg text-slate-600 leading-relaxed italic border-l-4 border-slate-300 pl-4 mb-6">
                ReviewSmart is an independent product recommendation service that helps you discover, compare, and choose the best products for your daily life. Our mission is to save you time and eliminate the stress of shopping by providing clear, honest, and highly detailed reviews.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 border-b border-slate-100 pb-2">
                How We Work
              </h2>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                We work with total editorial independence. This means we buy all the products we test at retail prices with our own funds, just like you do. We never accept free evaluation samples, sponsored content, or paid placements from manufacturers.
              </p>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                By purchasing all testing units ourselves at standard retail outlets, we ensure that we experience the exact same product quality, packaging, and shipping times as any regular consumer.
              </p>
            </section>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 my-8 space-y-4">
              <div className="flex gap-3 items-center text-slate-900 font-sans font-extrabold text-sm uppercase tracking-wider">
                <ShieldCheck className="text-slate-900 flex-shrink-0" size={22} />
                <span>Our Standard of Integrity</span>
              </div>
              <p className="font-serif text-sm text-slate-600 leading-relaxed">
                If we recommend a product, it is solely because our testers and editors believe it is the absolute best option available. If you purchase through our links, we may earn an affiliate commission from retailers, which helps fund our laboratory operations. We only recommend products that successfully pass our rigorous testing procedures.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 border-b border-slate-100 pb-2">
                Our Hands-On Testing Process
              </h2>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                To determine which product is truly the best, our team spends weeks researching, analyzing, and stress-testing products under both controlled laboratory environments and real-world conditions:
              </p>
              <ul className="list-none space-y-3 pl-0 font-serif text-base text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-2.5 flex-shrink-0"></span>
                  <span><strong>Market Research:</strong> We filter down the top 15-20 most popular and highly rated products in a category based on user reviews and technical specifications.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-2.5 flex-shrink-0"></span>
                  <span><strong>Functional Verification:</strong> We test physical durability, battery efficiency, and software reliability over extended periods of continuous usage.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-2.5 flex-shrink-0"></span>
                  <span><strong>User Surveys:</strong> We hand products over to testers with different backgrounds to gather diverse feedback on ergonomics, ease of use, and comfort.</span>
                </li>
              </ul>
            </section>
          </div>
        );

      case '/our-team':
        return (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div>
              <h1 className="font-serif font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight mb-4">
                Our Team
              </h1>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                ReviewSmart is powered by a team of veteran journalists, research specialists, consumer product engineers, and technical editors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-serif text-2xl font-bold flex-shrink-0">
                  LN
                </div>
                <div>
                  <h4 className="font-sans font-extrabold text-sm text-slate-900">Le Nguyen</h4>
                  <p className="font-sans text-[11px] text-slate-500 font-medium mb-3">Founder & Editor-in-Chief</p>
                  <p className="font-serif text-xs text-slate-600 leading-relaxed">
                    With over 12 years of experience in consumer tech journalism, Le leads the editorial team, ensuring all product trials conform to the highest industry standards of integrity.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-serif text-2xl font-bold flex-shrink-0">
                  AT
                </div>
                <div>
                  <h4 className="font-sans font-extrabold text-sm text-slate-900">Alex Tran</h4>
                  <p className="font-sans text-[11px] text-slate-500 font-medium mb-3">Lead Technical Analyst</p>
                  <p className="font-serif text-xs text-slate-600 leading-relaxed">
                    Trained in mechatronics engineering, Alex oversees hardware testing in our laboratory, using grade-A telemetry to measure battery efficiency and mechanical wear.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-700 text-white flex items-center justify-center font-serif text-2xl font-bold flex-shrink-0">
                  MP
                </div>
                <div>
                  <h4 className="font-sans font-extrabold text-sm text-slate-900">Mai Pham</h4>
                  <p className="font-sans text-[11px] text-slate-500 font-medium mb-3">Home & Living Editor</p>
                  <p className="font-serif text-xs text-slate-600 leading-relaxed">
                    Mai coordinates cook-offs and appliance stress testing, putting kitchen utensils through hundreds of hours of daily use to find potential design flaws.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-600 text-white flex items-center justify-center font-serif text-2xl font-bold flex-shrink-0">
                  KD
                </div>
                <div>
                  <h4 className="font-sans font-extrabold text-sm text-slate-900">Khanh Do</h4>
                  <p className="font-sans text-[11px] text-slate-500 font-medium mb-3">Consumer Tech Writer</p>
                  <p className="font-serif text-xs text-slate-600 leading-relaxed">
                    Khanh specializes in mobile rigs, personal setups, and audio gear testing, delivering in-depth analysis of the latest consumer electronics.
                  </p>
                </div>
              </div>
            </div>

            <section className="space-y-4 pt-4">
              <h2 className="font-serif font-bold text-xl text-slate-900">Editorial Independence</h2>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                Our editorial staff operates independently from our business and marketing teams. Writers and editors are not aware of affiliate revenues or commission structures when choosing products, ensuring that our buying advice remains purely unbiased.
              </p>
            </section>
          </div>
        );

      case '/staff-demographics':
        return (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div>
              <h1 className="font-serif font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight mb-4">
                Staff Demographics
              </h1>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                We believe a diverse editorial team leads to better, more inclusive testing processes and reviews that represent the values of all our readers.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="font-serif font-bold text-xl text-slate-900">Demographic Metrics (2026)</h2>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                We publish demographic details of our editorial staff annually to ensure transparency and track our progress:
              </p>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-6">
                <div>
                  <div className="flex justify-between font-sans text-xs font-bold text-slate-700 mb-1">
                    <span>Editorial Leadership Diversity</span>
                    <span>55% Female / 45% Male</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-slate-900 h-full" style={{ width: '55%' }}></div>
                    <div className="bg-slate-400 h-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-sans text-xs font-bold text-slate-700 mb-1">
                    <span>Experienced Industry Journalists</span>
                    <span>70%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-800 h-full" style={{ width: '70%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-sans text-xs font-bold text-slate-700 mb-1">
                    <span>Remote-first Staff Distribution</span>
                    <span>60% Regional Hubs / 40% Global Hubs</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-slate-800 h-full" style={{ width: '60%' }}></div>
                    <div className="bg-slate-500 h-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );



      case '/how-to-pitch':
        return (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div>
              <h1 className="font-serif font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight mb-4">
                How to Pitch to ReviewSmart
              </h1>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                We welcome pitches from freelance journalists, product developers, and field experts who have specialized experience in specific consumer categories.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="font-serif font-bold text-xl text-slate-900">What We Look For</h2>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                We do not publish simple summary articles rewritten from information available on the web. A successful pitch needs to show:
              </p>
              <ul className="list-disc pl-5 font-serif text-base text-slate-700 space-y-2">
                <li><strong>Clear Testing Methodology:</strong> How do you plan to test the products? (e.g. cutting 20lbs of meat to check chef's knife durability, testing robot vacuums on three carpet styles).</li>
                <li><strong>Ergonomic Insight:</strong> We value real-world comfort and utility, not just list specs.</li>
                <li><strong>Zero Conflicts of Interest:</strong> You cannot have any advertising, sponsorship, or affiliate relations with the brands being tested.</li>
              </ul>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="font-serif font-bold text-xl text-slate-900">Submission Guidelines</h2>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                Please submit a short pitch (under 500 words) to: <span className="font-mono font-bold text-slate-900">pitches@reviewsmart.com</span> with the subject format: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">[Pitch] Category - Your Name</code>.
              </p>
            </section>
          </div>
        );

      case '/contact':
        return (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div>
              <h1 className="font-serif font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight mb-4">
                Contact Us
              </h1>
              <p className="font-serif text-base text-slate-700 leading-relaxed">
                Have feedback, questions, or corrections? We would love to hear from you. Fill out the contact form below and our team will get back to you shortly.
              </p>
            </div>

            {contactSuccess ? (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-sans font-bold">
                <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
                <span>Thank you! Your message has been sent successfully. Our support team will get back to you shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 max-w-lg bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-slate-400"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-slate-400"
                    placeholder="e.g. john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-slate-400"
                    placeholder="Provide your feedback, questions, or product correction requests..."
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-900 text-white font-sans font-extrabold text-xs rounded-xl hover:bg-slate-800 transition flex items-center gap-2 justify-center"
                >
                  <Send size={14} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12 space-y-4">
            <h2 className="font-serif font-black text-2xl text-slate-800">Page not found</h2>
            <p className="text-slate-600">The requested information page does not exist.</p>
            <Link to={basePath || '/'} className="inline-block text-xs font-extrabold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition">
              Back to Home
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-10 text-left">
          <h3 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400 mb-5 px-3">
            REVIEWSMART INFO
          </h3>
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = cleanPath === link.path.replace(/^\/admin/, '');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-3 rounded-xl text-xs font-sans transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-50 text-slate-900 font-extrabold border-l-2 border-slate-900 pl-3'
                      : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900 font-bold'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Right Dynamic Content Pane */}
        <main className="flex-grow text-left max-w-3xl">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}
