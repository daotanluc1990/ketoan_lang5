import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { bieuMau } from '@/lib/tai-lieu/noi-dung';

export const dynamic = 'force-dynamic';

export default function TaiLieuBieuMauPage() {
  return (
    <div className='space-y-4'>
      <PageHeader title='Biểu mẫu & Báo cáo mẫu' description='Module Tài liệu nội bộ — tra cứu khi cần.' status='Đang dùng' />
      <div className='grid gap-3 md:grid-cols-2'>
        {bieuMau.map((doc) => (
          <Card key={doc.id}>
            <div className='mb-2 flex items-center justify-between'>
              <CardTitle>{doc.title}</CardTitle>
              <span className='rounded-full bg-lang-redSoft px-2 py-0.5 text-xs font-bold text-lang-red'>{doc.id}</span>
            </div>
            <p className='text-sm text-lang-muted'>{doc.moTa}</p>
            <p className='mt-2 text-xs font-semibold text-lang-ink'>Module: {doc.module} · Người phụ trách: {doc.nguoiPhuTrach}</p>
            <ol className='mt-3 space-y-1'>
              {doc.noiDung.map((step, i) => (
                <li key={i} className='text-xs text-lang-ink'>{step}</li>
              ))}
            </ol>
            <div className='mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800'>
              Khi nào báo CEO: {doc.khiNaoBaoCeo}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
