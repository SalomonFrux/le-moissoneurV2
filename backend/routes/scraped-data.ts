import express from 'express';
import { supabase } from '../db';

const router = express.Router();

// Get paginated and filtered scraped data
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 5000, 5000); // Cap at 5000 rows per page
    const search = req.query.search as string;
    const country = req.query.country as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const scraper_id = req.query.scraper_id as string;

    // Start building the query
    let query = supabase
      .from('scraped_data')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`nom.ilike.%${search}%,secteur.ilike.%${search}%,pays.ilike.%${search}%`);
    }

    if (country) {
      query = query.eq('pays', country);
    }

    // Handle scraper filtering - try both scraper_id and source
    if (scraper_id) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scraper_id)) {
        // If it's a UUID, try to match scraper_id
        query = query.eq('scraper_id', scraper_id);
      } else {
        // If not a UUID, try to match source
        const { data: scraperData } = await supabase
          .from('scrapers')
          .select('source')
          .eq('id', scraper_id)
          .single();
        
        if (scraperData?.source) {
          query = query.eq('source', scraperData.source);
        }
      }
    }

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'name':
          query = query.order('nom', { ascending: sortOrder === 'asc' });
          break;
        case 'date':
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
          break;
        default:
          query = query.order('created_at', { ascending: false }); // Default sort by newest
      }
    } else {
      query = query.order('created_at', { ascending: false }); // Default sort by newest
    }

    // Apply pagination
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      data,
      total: count || 0,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching scraped data:', error);
    res.status(500).json({ error: 'Failed to fetch scraped data' });
  }
});

// Get all scraped data (for export)
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scraped_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Group data by scraper
    const groupedData = data.reduce((acc: any[], entry) => {
      const group = acc.find(g => g.scraper_name === entry.source);
      if (group) {
        group.entries.push(entry);
      } else {
        acc.push({
          scraper_name: entry.source,
          entries: [entry]
        });
      }
      return acc;
    }, []);

    res.json(groupedData);
  } catch (error) {
    console.error('Error fetching all scraped data:', error);
    res.status(500).json({ error: 'Failed to fetch all scraped data' });
  }
});

// Update scraped entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const { data, error } = await supabase
      .from('scraped_data')
      .update(updateData)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating scraped entry:', error);
    res.status(500).json({ error: 'Failed to update scraped entry' });
  }
});

// Delete scraped entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const { error } = await supabase
      .from('scraped_data')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting scraped entry:', error);
    res.status(500).json({ error: 'Failed to delete scraped entry' });
  }
});

export default router; 