-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add initial admin users (password: extracteur2025@)
INSERT INTO users (email, password_hash, role)
VALUES (
    'extracteur@sikso.com',
    '$2b$10$O4eivaV8lgDoHTm2tgVsLeaovBOWRRN95s95SeANk6RP8Q3FoXkEW',
    'admin'
) ON CONFLICT (email) DO NOTHING; 



INSERT INTO users (email, password_hash, role)
VALUES (
    'michael.sea@sikso.ch',
    '$2b$12$YuxljhRa6aPeDBNA76VSiuQMtnUEeLAYMp99f4jLpbP8PjLI5vcNW',
    'admin'
) ON CONFLICT (email) DO NOTHING; 

