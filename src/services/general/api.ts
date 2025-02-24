import { supabase } from '@/services/supabase';
import { message } from 'antd';
import { SortOrder } from 'antd/lib/table/interface';
import { getLocale } from 'umi';

export async function getDataDetail(id: string, version: string, table: string) {
  let result: any = {};
  if (id && id.length === 36) {
    if (version && version.length === 9) {
      result = await supabase
        .from(table)
        .select('json,version, modified_at')
        .eq('id', id)
        .eq('version', version);
      if (result.data === null || result.data.length === 0) {
        result = await supabase
          .from(table)
          .select('json,version, modified_at')
          .eq('id', id)
          .order('version', { ascending: false })
          .range(0, 0);
      }
    } else {
      result = await supabase
        .from(table)
        .select('json,version, modified_at')
        .eq('id', id)
        .order('version', { ascending: false })
        .range(0, 0);
    }
    if (result?.data && result.data.length > 0) {
      const data = result.data[0];
      return Promise.resolve({
        data: {
          id: id,
          version: data.version,
          json: data.json,
          modifiedAt: data?.modified_at,
        },
        success: true,
      });
    }
  }
  return Promise.resolve({
    data: null,
    success: false,
  });
}

// Get the team id of the user when the user is not an invited user and  is not a rejected user
export async function getTeamIdByUserId() {
  const session = await supabase.auth.getSession();
  const { data } = await supabase
    .from('roles')
    .select(
      ` 
      user_id,
      team_id,
      role
      `,
    )
    .eq('user_id', session?.data?.session?.user?.id);

  if (data && data.length > 0 && data[0].role !== 'is_invited' && data[0].role !== 'rejected') {
    return data[0].team_id;
  }
  return null;
}

export async function contributeSource(tableName: string, id: string, version: string) {
  const teamId = await getTeamIdByUserId();
  if (teamId) {
    const result = await supabase
      .from(tableName)
      .update({ team_id: teamId })
      .eq('id', id)
      .eq('version', version);

    return result;
  } else {
    message.error(
      getLocale() === 'zh-CN' ? '您不是任何团队的成员' : 'You are not a member of any team',
    );
  }
  return {
    error: true,
    message: 'Contribute failed',
  };
}

export async function getVersionsById(
  tableName: string,
  id: string,
  params: { pageSize: number; current: number },
  sort: Record<string, SortOrder>,
) {
  const sortBy = Object.keys(sort)[0] ?? 'created_at';
  const orderBy = sort[sortBy] ?? 'descend';

  const { error, data, count } = await supabase
    .from(tableName)
    .select('version, created_at, modified_at', { count: 'exact' })
    .eq('id', id)
    .order(sortBy, { ascending: orderBy === 'ascend' })
    .range(
      ((params.current ?? 1) - 1) * (params.pageSize ?? 10),
      (params.current ?? 1) * (params.pageSize ?? 10) - 1,
    );
  if (!error) {
    return Promise.resolve({
      data: data ?? [],
      success: true,
      total: count ?? 0,
    });
  } else {
    return Promise.resolve({
      data: [],
      success: false,
      total: 0,
    });
  }
}
