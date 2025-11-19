import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário é admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isAdmin = roles?.some(r => r.role === 'admin')
    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required')
    }

    const body = await req.json()
    const { action, userId, status, role, email, nome } = body

    console.log('Admin action:', { action, userId, status, role, adminId: user.id })

    switch (action) {
      case 'list': {
        // Buscar todos os usuários com seus dados
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) throw profilesError

        const { data: userRoles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id, role')

        if (rolesError) throw rolesError

        // Buscar emails da tabela allowed_emails
        const { data: allowedEmails, error: emailsError } = await supabaseAdmin
          .from('allowed_emails')
          .select('email, nome')

        if (emailsError) throw emailsError

        // Buscar emails dos usuários autenticados
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (authError) throw authError

        // Combinar dados
        const usersData = profiles.map(profile => {
          const authUser = users.find(u => u.id === profile.user_id)
          const roles = userRoles?.filter(r => r.user_id === profile.user_id).map(r => r.role) || []
          
          return {
            id: profile.user_id,
            nome: profile.nome,
            email: authUser?.email || '',
            avatar: profile.avatar,
            ativo: profile.ativo,
            roles: roles,
            created_at: profile.created_at,
          }
        })

        return new Response(
          JSON.stringify({ users: usersData, allowedEmails }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'toggle_status': {
        // Evitar que admin se bloqueie
        if (userId === user.id) {
          throw new Error('Cannot modify your own status')
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ ativo: status })
          .eq('user_id', userId)

        if (error) throw error

        // Se bloqueando (status = false), invalidar todas as sessões do usuário
        if (status === false) {
          try {
            await supabaseAdmin.auth.admin.signOut(userId, 'global')
            console.log('User sessions invalidated:', { userId })
          } catch (signOutError) {
            console.error('Error signing out user:', signOutError)
            // Não falhar a operação se signOut der erro
          }
        }

        console.log('User status toggled:', { userId, status })

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        // Evitar que admin se delete
        if (userId === user.id) {
          throw new Error('Cannot delete yourself')
        }

        // Deletar usuário (cascade vai deletar profile e roles)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) throw error

        console.log('User deleted:', { userId })

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_role': {
        // Evitar que admin mude sua própria role
        if (userId === user.id) {
          throw new Error('Cannot modify your own role')
        }

        // Remover role antiga
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId)

        // Adicionar nova role
        const { error } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role })

        if (error) throw error

        console.log('User role updated:', { userId, role })

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'add_to_whitelist': {
        // email e nome já extraídos do body no início

        const { error } = await supabaseAdmin
          .from('allowed_emails')
          .insert({ email: email.toLowerCase(), nome, cadastrado_por: user.id })

        if (error) throw error

        console.log('Email added to whitelist:', { email, nome })

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_nome': {
        // nome já extraído do body no início

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ nome })
          .eq('user_id', userId)

        if (error) throw error

        console.log('User name updated:', { userId, nome })

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error in admin-usuarios function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorMessage.includes('Unauthorized') ? 401 : 
                errorMessage.includes('Forbidden') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})