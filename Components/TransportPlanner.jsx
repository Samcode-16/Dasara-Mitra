import React, { useState } from 'react';
import { useLanguage, EVENTS_DATA } from './DasaraContext';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui.jsx';
import { Bus, Car, Truck, Clock, IndianRupee, MapPin } from 'lucide-react';

export default function TransportPlanner() {
  const { t, language } = useLanguage();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = () => {
    if (!fromId || !toId || fromId === toId) return;
    
    setLoading(true);
    // Simulate API calculation delay
    setTimeout(() => {
      const fromEvent = EVENTS_DATA.find(e => e.id.toString() === fromId);
      const toEvent = EVENTS_DATA.find(e => e.id.toString() === toId);
      
      // Mock distances roughly
      const dist = Math.floor(Math.random() * 5) + 2; // 2-7 km random
      
      setRoute({
        from: language === 'kn' ? fromEvent.name_kn : fromEvent.name,
        to: language === 'kn' ? toEvent.name_kn : toEvent.name,
        distance: dist,
        options: [
          { type: 'bus', duration: dist * 5 + 10, cost: 15, icon: Bus },
          { type: 'taxi', duration: dist * 2 + 5, cost: dist * 20, icon: Car },
          { type: 'auto', duration: dist * 3 + 5, cost: dist * 15, icon: Truck },
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <section id="transport" className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          {/* Form */}
          <Card className="border-t-4 border-t-[#DAA520]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#800000]" />
                {t('findRoute')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('fromEvent')}</label>
                <select
                  value={fromId}
                  onChange={(event) => setFromId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#800000] focus:ring-2 focus:ring-[#DAA520]"
                >
                  <option value="">Select starting point</option>
                  {EVENTS_DATA.map((event) => (
                    <option key={event.id} value={event.id.toString()}>
                      {language === 'kn' ? event.name_kn : event.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('toEvent')}</label>
                <select
                  value={toId}
                  onChange={(event) => setToId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#800000] focus:ring-2 focus:ring-[#DAA520]"
                >
                  <option value="">Select destination</option>
                  {EVENTS_DATA.map((event) => (
                    <option key={event.id} value={event.id.toString()}>
                      {language === 'kn' ? event.name_kn : event.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button 
                className="w-full bg-[#800000] hover:bg-[#600000] text-white"
                onClick={handleCalculate}
                disabled={loading || !fromId || !toId}
              >
                {loading ? t('calculating') : t('findRoute')}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {!route && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px] border-2 border-dashed rounded-xl p-8 bg-white/50">
                <Bus className="w-16 h-16 mb-4 opacity-20" />
                <p>Select locations to see transport options</p>
              </div>
            )}

            {loading && (
               <div className="space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                 ))}
               </div>
            )}

            {route && !loading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  {t('routeDetails')}
                  <span className="text-xs font-normal text-gray-500 ml-auto">
                    Approx {route.distance} km
                  </span>
                </h3>
                
                {route.options.map((opt, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-all cursor-pointer active:scale-[0.99]">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          opt.type === 'bus' ? 'bg-blue-100 text-blue-600' : 
                          opt.type === 'taxi' ? 'bg-yellow-100 text-yellow-600' : 
                          'bg-green-100 text-green-600'
                        }`}>
                          <opt.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold capitalize text-gray-800">{opt.type}</p>
                          <p className="text-xs text-gray-500">Frequent service</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 font-bold text-[#800000]">
                          <IndianRupee className="w-3 h-3" />
                          {opt.cost}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          {opt.duration} min
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="pt-4 flex gap-2">
                    <Button variant="outline" className="flex-1 border-yellow-600 text-yellow-700">
                        Book Ola
                    </Button>
                     <Button variant="outline" className="flex-1 border-black text-black">
                        Book Uber
                    </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}