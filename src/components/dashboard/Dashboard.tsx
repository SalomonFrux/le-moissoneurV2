import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { StatsCard } from './StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getScrapers } from '../../services/scraperService';
import { getAllData } from '../../services/dataService';
import { LineChart, BarChart, Database, Globe } from 'lucide-react';

export function Dashboard() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScrapers: 0,
    activeScrapers: 0,
    totalDataPoints: 0,
    recentDataPoints: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        
        // Get stats about scrapers
        const scrapers = await getScrapers();
        const activeScrapers = scrapers.filter(s => s.status === 'active').length;
        
        // Get stats about data
        const allData = await getAllData();
        
        // Calculate data from the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentData = allData.filter(
          d => new Date(d.scraped_at) > oneDayAgo
        ).length;
        
        setStats({
          totalScrapers: scrapers.length,
          activeScrapers,
          totalDataPoints: allData.length,
          recentDataPoints: recentData,
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    loadStats();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your scraper dashboard. Manage your scrapers and view collected data.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Scrapers"
          value={stats.totalScrapers.toString()}
          description="Total configured scrapers"
          icon={<Database className="h-4 w-4" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Active Scrapers"
          value={stats.activeScrapers.toString()}
          description="Scrapers with active status"
          icon={<Globe className="h-4 w-4" />}
          loading={statsLoading}
          delta={(stats.totalScrapers > 0
            ? Math.round((stats.activeScrapers / stats.totalScrapers) * 100)
            : 0) + '%'}
        />
        <StatsCard
          title="Total Data"
          value={stats.totalDataPoints.toString()}
          description="Total data points collected"
          icon={<BarChart className="h-4 w-4" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Recent Data"
          value={stats.recentDataPoints.toString()}
          description="Data collected in last 24h"
          icon={<LineChart className="h-4 w-4" />}
          loading={statsLoading}
          delta={stats.totalDataPoints > 0
            ? `${Math.round((stats.recentDataPoints / stats.totalDataPoints) * 100)}% of total`
            : '0%'}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scrapers</CardTitle>
            <CardDescription>
              Manage your web scrapers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <p>Configure and run web scrapers to collect data from websites.</p>
              <Link to="/scrapers">
                <Button className="mt-4">Manage Scrapers</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Scraped Data</CardTitle>
            <CardDescription>
              View and analyze collected data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <p>Browse, search, and export data collected by your scrapers.</p>
              <Link to="/data">
                <Button className="mt-4">View Data</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}