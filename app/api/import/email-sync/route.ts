import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { syncUserEmails } from '@/lib/import/emailSync';

export async function POST() {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le token d'importation de l'utilisateur
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('import_token')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings?.import_token) {
      return NextResponse.json({ error: "Jeton d'importation non configuré" }, { status: 400 });
    }

    const importedIds = await syncUserEmails(user.id, settings.import_token);

    return NextResponse.json({
      success: true,
      count: importedIds.length,
      importedIds
    });
  } catch (error: any) {
    console.error('Email sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
