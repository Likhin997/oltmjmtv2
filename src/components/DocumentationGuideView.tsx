import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  Printer,
  Server,
  Router,
  Wifi,
  Network,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Layers,
  ZoomIn,
  X,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { generateAuthorizeCliScript, WanModeOption } from '../services/oltEngine';
import ftthTopologyImg from '../assets/images/ftth_topology_dummy_1795758601117.jpg';
import oltSetupImg from '../assets/images/olt_setup_guide_1795758610707.jpg';
import onuAuthorizeImg from '../assets/images/onu_authorize_guide_1795758610465.jpg';
import dummyLabDevicesImg from '../assets/images/dummy_lab_devices_1795758611276.jpg';

type DocTab = 'TOPOLOGY_DUMMY' | 'OLT_SETUP' | 'ONU_AUTHORIZE' | 'TROUBLESHOOTING';

interface DummyOnuPreset {
  id: string;
  label: string;
  badge: string;
  tech: 'GPON' | 'EPON';
  boardModel: 'GTGH' | 'ETGH';
  ponInterface: string;
  onuIndex: number;
  onuType: string;
  serialNumber: string;
  customerName: string;
  address: string;
  vlanId: number;
  onuMode: 'Routing' | 'Bridging';
  wanMode: WanModeOption;
  pppoeUsername?: string;
  pppoePassword?: string;
  speedProfile: string;
  tcontProfile: string;
  wifiSsid?: string;
  wifiPassword?: string;
  rxDbm: string;
  odp: string;
  uncfgCommand: string;
  uncfgSampleOutput: string;
}

const DUMMY_ONU_PRESETS: DummyOnuPreset[] = [
  {
    id: 'f609-gpon-pppoe',
    label: 'ONU Dummy #1 — ZTE F609 (GPON GTGH · Routing PPPoE)',
    badge: 'GPON · PPPoE',
    tech: 'GPON',
    boardModel: 'GTGH',
    ponInterface: 'gpon-olt_1/3/1',
    onuIndex: 1,
    onuType: 'ZTE-F609',
    serialNumber: 'ZTEGC85A1101',
    customerName: 'BUDI-SANTOSO-01',
    address: 'Jl. Merdeka No.12 · ODP-LBK-01 Port 1',
    vlanId: 101,
    onuMode: 'Routing',
    wanMode: 'PPPOE',
    pppoeUsername: 'cust_budi01@isp.net',
    pppoePassword: 'budi12345',
    speedProfile: '50M-DOWN',
    tcontProfile: 'SMARTOLT-1G-UP',
    wifiSsid: 'JETCYBER-BUDI01',
    wifiPassword: 'password123',
    rxDbm: '-19.45 dBm',
    odp: 'ODP-LBK-01 (Port 1/8)',
    uncfgCommand: 'show gpon onu uncfg',
    uncfgSampleOutput: `OnuIndex                 Sn                  State
---------------------------------------------------------------------
gpon-onu_1/3/1:1         ZTEGC85A1101        unknown`,
  },
  {
    id: 'f670l-gpon-bridge',
    label: 'ONU Dummy #2 — ZTE F670L (GPON GTGH · Bridging)',
    badge: 'GPON · Bridge',
    tech: 'GPON',
    boardModel: 'GTGH',
    ponInterface: 'gpon-olt_1/3/1',
    onuIndex: 2,
    onuType: 'ZTE-F670L',
    serialNumber: 'ZTEGC85A2202',
    customerName: 'WARNET-JAYA-02',
    address: 'Ruko Alun-Alun Blok B · ODP-LBK-01 Port 2',
    vlanId: 102,
    onuMode: 'Bridging',
    wanMode: 'BRIDGE',
    speedProfile: '100M-DOWN',
    tcontProfile: 'SMARTOLT-1G-UP',
    rxDbm: '-21.10 dBm',
    odp: 'ODP-LBK-01 (Port 2/8)',
    uncfgCommand: 'show gpon onu uncfg',
    uncfgSampleOutput: `OnuIndex                 Sn                  State
---------------------------------------------------------------------
gpon-onu_1/3/1:2         ZTEGC85A2202        unknown`,
  },
  {
    id: 'f460-epon-pppoe',
    label: 'ONU Dummy #3 — ZTE F460 (EPON ETGH · Routing PPPoE)',
    badge: 'EPON ETGH · MAC',
    tech: 'EPON',
    boardModel: 'ETGH',
    ponInterface: 'epon-olt_1/2/1',
    onuIndex: 1,
    onuType: 'ZTE-F460',
    serialNumber: 'c85a.9f11.2233',
    customerName: 'TOKO-SINAR-03',
    address: 'Jl. Pasar Baru No.5 · ODP-EPON-01 Port 1',
    vlanId: 101,
    onuMode: 'Routing',
    wanMode: 'PPPOE',
    pppoeUsername: 'cust_sinar03@isp.net',
    pppoePassword: 'sinar12345',
    speedProfile: '50M-DOWN',
    tcontProfile: 'SMARTOLT-1G-UP',
    wifiSsid: 'JETCYBER-SINAR03',
    wifiPassword: 'password123',
    rxDbm: '-20.30 dBm',
    odp: 'ODP-EPON-01 (Port 1/8)',
    uncfgCommand: 'show onu unauthentication',
    uncfgSampleOutput: `OnuInterface            MacAddress       Type         State
---------------------------------------------------------------------
epon-onu_1/2/1:1        c85a.9f11.2233   ZTE-F460     unauthenticated`,
  },
];

const UPLINK_SAMPLE_CLI = `configure terminal
vlan 100
  name MGMT_TR069
exit
vlan 101
  name PPPOE_CUST
exit
vlan 102
  name HOTSPOT_BRIDGE
exit
vlan 999
  name OLT_MGMT
exit
interface xgei_1/19/1
  description "UPLINK-MIKROTIK-CCR"
  phy-attribute lan
  no shutdown
  hybrid-attribute fiber
  no negotiation auto
  speed 10000
  duplex full
  switchport mode hybrid
  switchport default vlan 1
  switchport vlan 100,101,102,999 tag
  port-protect disable
  uplink-isolate disable
exit
end
write`;

const PON_ENABLE_SAMPLE_CLI = `! Aktifkan Port PON GPON (Card GTGH Slot 3)
configure terminal
interface gpon-olt_1/3/1
  no shutdown
  linktrap enable
  description "ODC-LEBAK-UTARA-01"
exit
! Aktifkan Port PON EPON (Card ETGH Slot 2)
interface epon-olt_1/2/1
  no shutdown
  linktrap enable
  description "ODC-EPON-PASAR-01"
exit
end
write`;

const MIKROTIK_DUMMY_CLI = `# Contoh Konfigurasi Router Core MikroTik CCR1036 (Dummy Lab)
/interface vlan
add interface=sfp-sfpplus1 name=vlan100-mgmt vlan-id=100
add interface=sfp-sfpplus1 name=vlan101-pppoe vlan-id=101
add interface=sfp-sfpplus1 name=vlan102-hotspot vlan-id=102
add interface=sfp-sfpplus1 name=vlan999-olt vlan-id=999

/ip address
add address=10.10.10.1/24 interface=vlan999-olt comment="OLT Management"
add address=10.69.69.1/24 interface=vlan100-mgmt comment="TR-069 ACS Network"

/ip pool
add name=pool-pppoe ranges=100.64.1.2-100.64.1.254

/ppp profile
add name=prof-50M local-address=100.64.1.1 remote-address=pool-pppoe rate-limit=50M/50M

/interface pppoe-server server
add interface=vlan101-pppoe service-name=PPPOE-OLT default-profile=prof-50M disabled=no

/ppp secret
add name=cust_budi01@isp.net password=budi12345 service=pppoe profile=prof-50M
add name=cust_sinar03@isp.net password=sinar12345 service=pppoe profile=prof-50M`;

export const DocumentationGuideView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DocTab>('TOPOLOGY_DUMMY');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    DUMMY_ONU_PRESETS[0].id
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{
    src: string;
    title: string;
  } | null>(null);

  const selectedPreset =
    DUMMY_ONU_PRESETS.find((p) => p.id === selectedPresetId) ||
    DUMMY_ONU_PRESETS[0];

  const generatedDummyCli = generateAuthorizeCliScript({
    firmwareVersion: 'V2.1.0',
    ponInterface: selectedPreset.ponInterface,
    onuIndex: selectedPreset.onuIndex,
    onuType: selectedPreset.onuType,
    serialNumber: selectedPreset.serialNumber,
    customerName: selectedPreset.customerName,
    address: selectedPreset.address,
    vlanId: selectedPreset.vlanId,
    tcontProfile: selectedPreset.tcontProfile,
    speedProfile: selectedPreset.speedProfile,
    onuMode: selectedPreset.onuMode,
    wanMode: selectedPreset.wanMode,
    enableNat: selectedPreset.onuMode === 'Routing',
    configMethod: 'OMCI',
    pppoeUsername: selectedPreset.pppoeUsername,
    pppoePassword: selectedPreset.pppoePassword,
    wanRemoteAccess: 'Enabled from everywhere in the internet',
    tr069Enabled: selectedPreset.onuMode === 'Routing',
    tr069AcsUrl: 'http://10.69.69.1:14501',
    tr069AcsUsername: 'acsNet',
    tr069AcsPassword: 'acsNet@2024',
    tr069MgmtVlanId: 100,
    tr069Priority: 2,
    wifiSsid: selectedPreset.wifiSsid,
    wifiPassword: selectedPreset.wifiPassword,
  });

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const renderCodeBlock = (key: string, title: string, code: string) => (
    <div className="overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d192b] px-3.5 py-2">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-emerald-400">
          <Terminal className="h-3.5 w-3.5" />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={() => handleCopy(key, code)}
          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-sky-600 hover:text-white"
        >
          {copiedKey === key ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              Disalin
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy CLI
            </>
          )}
        </button>
      </div>
      <pre className="max-h-72 overflow-auto p-3.5 font-mono text-[11px] leading-relaxed text-emerald-300">
        {code}
      </pre>
    </div>
  );

  const renderImageCard = (src: string, title: string, caption: string) => (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-[#0f172a] shadow-lg">
      <div className="group relative cursor-pointer overflow-hidden bg-slate-950">
        <img
          src={src}
          alt={title}
          referrerPolicy="no-referrer"
          onClick={() => setZoomedImage({ src, title })}
          className="w-full object-cover transition duration-300 group-hover:scale-[1.01]"
        />
        <button
          type="button"
          onClick={() => setZoomedImage({ src, title })}
          className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/85 px-3 py-1.5 text-[11px] font-semibold text-sky-300 backdrop-blur-xs transition hover:bg-sky-600 hover:text-white"
        >
          <ZoomIn className="h-3.5 w-3.5" />
          Perbesar Gambar
        </button>
      </div>
      <div className="border-t border-slate-800 px-4 py-3">
        <div className="text-xs font-bold text-white">{title}</div>
        <p className="mt-0.5 text-[11px] text-slate-400">{caption}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 text-xs text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-gradient-to-r from-[#0e1b30] via-[#10233d] to-[#0d1c2e] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/15 text-sky-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white sm:text-lg">
              Dokumentasi Registrasi &amp; Konfigurasi OLT/ONU (Lengkap Alat Dummy)
            </h1>
            <p className="mt-0.5 text-xs text-slate-300">
              Panduan end-to-end untuk ZTE C300/C320 (GTGH GPON &amp; ETGH EPON), konfigurasi Uplink VLAN, Aktivasi PON, Authorize ONU, Auto-Provisioning, dan data dummy siap uji.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sky-500 print:hidden"
        >
          <Printer className="h-3.5 w-3.5" />
          Cetak / Export PDF
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 print:hidden">
        {(
          [
            {
              id: 'TOPOLOGY_DUMMY',
              label: '1. Topologi & Alat Dummy',
              icon: Router,
            },
            {
              id: 'OLT_SETUP',
              label: '2. Registrasi OLT, VLAN & Uplink',
              icon: Server,
            },
            {
              id: 'ONU_AUTHORIZE',
              label: '3. Registrasi ONU & Simulator CLI',
              icon: Wifi,
            },
            {
              id: 'TROUBLESHOOTING',
              label: '4. Verifikasi & Troubleshooting',
              icon: ShieldCheck,
            },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: TOPOLOGI & ALAT DUMMY LAB                                  */}
      {/* ================================================================= */}
      {activeTab === 'TOPOLOGY_DUMMY' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {renderImageCard(
              ftthTopologyImg,
              'Gambar 1 — Topologi FTTH Lab Dummy (MikroTik → ZTE OLT → ODP → ONU)',
              'Alur koneksi lengkap dari Router Core MikroTik CCR (10.10.10.1) lewat Uplink 10G xgei_1/19/1 ke ZTE C320 OLT (Slot 3 GTGH GPON & Slot 2 ETGH EPON), Splitter ODP 1:8, hingga 3 ONU Dummy.'
            )}
            {renderImageCard(
              dummyLabDevicesImg,
              'Gambar 2 — Daftar Perangkat Fisik / Alat Dummy Lab FTTH',
              'Ilustrasi komponen lab standar: ZTE C320 OLT, MikroTik CCR Core Router, Box ODP Splitter 1:8, Optical Power Meter (-19.45 dBm), serta modem ONU ZTE F609 & F670L.'
            )}
          </div>

          {/* Tabel Perangkat Dummy */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0e1624]">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#121d30] px-4 py-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Cpu className="h-4 w-4 text-sky-400" />
                <span>Inventaris Alat Dummy &amp; Parameter Lab Siap Uji</span>
              </div>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                LAB PRESET V2.1
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Perangkat Dummy</th>
                    <th className="px-4 py-2.5">Model / Board</th>
                    <th className="px-4 py-2.5">IP / SN / MAC</th>
                    <th className="px-4 py-2.5">Interface / Port</th>
                    <th className="px-4 py-2.5">VLAN &amp; Fungsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-sky-300">Router Core (BRAS)</td>
                    <td className="px-4 py-2.5">MikroTik CCR1036-12G-4S</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-300">10.10.10.1 / 24</td>
                    <td className="px-4 py-2.5 font-mono">sfp-sfpplus1 (10G)</td>
                    <td className="px-4 py-2.5">PPPoE Server (101), Hotspot (102), ACS TR-069 (100), OLT Mgmt (999)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-sky-300">OLT Utama (Dummy)</td>
                    <td className="px-4 py-2.5">ZTE ZXA10 C320 (V2.1.0)</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-300">10.10.10.2 : 23</td>
                    <td className="px-4 py-2.5 font-mono">xgei_1/19/1, GTGH S3, ETGH S2</td>
                    <td className="px-4 py-2.5">User Telnet: <code className="text-amber-300">zte / zxr10</code> · Hybrid VLAN 100,101,102,999</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-sky-300">Distribusi ODP</td>
                    <td className="px-4 py-2.5">Splitter PLC 1:8 SC/APC</td>
                    <td className="px-4 py-2.5 font-mono">ODP-LBK-01</td>
                    <td className="px-4 py-2.5 font-mono">Zone: Lebak-Utara / RK-01</td>
                    <td className="px-4 py-2.5">Redaman splitter ±10.5 dB · Target RX ONU: -18 s/d -23 dBm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-emerald-300">ONU Dummy #1</td>
                    <td className="px-4 py-2.5">ZTE F609 V3 (GPON)</td>
                    <td className="px-4 py-2.5 font-mono text-amber-300">ZTEGC85A1101</td>
                    <td className="px-4 py-2.5 font-mono">gpon-onu_1/3/1:1</td>
                    <td className="px-4 py-2.5">Mode <b>Routing PPPoE</b> · VLAN 101 · 50M · RX -19.45 dBm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-emerald-300">ONU Dummy #2</td>
                    <td className="px-4 py-2.5">ZTE F670L (GPON)</td>
                    <td className="px-4 py-2.5 font-mono text-amber-300">ZTEGC85A2202</td>
                    <td className="px-4 py-2.5 font-mono">gpon-onu_1/3/1:2</td>
                    <td className="px-4 py-2.5">Mode <b>Bridging</b> · VLAN 102 · 100M · RX -21.10 dBm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-purple-300">ONU Dummy #3</td>
                    <td className="px-4 py-2.5">ZTE F460 (EPON / ETGH)</td>
                    <td className="px-4 py-2.5 font-mono text-amber-300">c85a.9f11.2233</td>
                    <td className="px-4 py-2.5 font-mono">epon-onu_1/2/1:1</td>
                    <td className="px-4 py-2.5">Mode <b>Routing PPPoE</b> · VLAN 101 · 50M · RX -20.30 dBm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Alokasi VLAN Dummy + Script MikroTik */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#0e1624] p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Layers className="h-4 w-4 text-emerald-400" />
                <span>Skema Alokasi VLAN Standar Lab</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  {
                    id: 'VLAN 100',
                    name: 'MGMT_TR069',
                    desc: 'Manajemen ACS GenieACS / TR-069 & VoIP (NAT Dimatikan)',
                    color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
                  },
                  {
                    id: 'VLAN 101',
                    name: 'PPPOE_CUST',
                    desc: 'Layanan Internet PPPoE Pelanggan Rumahan (NAT Aktif)',
                    color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
                  },
                  {
                    id: 'VLAN 102',
                    name: 'HOTSPOT_BRIDGE',
                    desc: 'Mode Bridge ke Router Pelanggan / Voucher Hotspot',
                    color: 'border-sky-500/40 bg-sky-950/20 text-sky-300',
                  },
                  {
                    id: 'VLAN 999',
                    name: 'OLT_MGMT',
                    desc: 'Akses IP Telnet/SNMP ke Manajemen OLT ZTE C300/C320',
                    color: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
                  },
                ].map((v) => (
                  <div key={v.id} className={`rounded-lg border p-3 ${v.color}`}>
                    <div className="font-mono text-xs font-bold">
                      {v.id} · {v.name}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {renderCodeBlock(
              'mikrotik-dummy',
              'Script MikroTik Core Dummy (VLAN + PPPoE Server)',
              MIKROTIK_DUMMY_CLI
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: REGISTRASI OLT & KONFIGURASI AWAL                          */}
      {/* ================================================================= */}
      {activeTab === 'OLT_SETUP' && (
        <div className="space-y-5">
          {renderImageCard(
            oltSetupImg,
            'Gambar 3 — Alur Registrasi OLT, Card GTGH/ETGH & Tagging VLAN Uplink',
            'Tampilan manajemen card OLT (GTGH 16P GPON & ETGH 16P EPON), pengaturan port uplink xgei_1/19/1 mode Hybrid dengan VLAN 100,101,102,999, dan preview script CLI ZTE.'
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-800 bg-[#0e1624] p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Server className="h-4 w-4 text-sky-400" />
                Langkah 1 — Registrasi Perangkat OLT Baru
              </h3>
              <ol className="list-decimal space-y-2 pl-4 text-slate-300">
                <li>
                  Buka menu <b className="text-white">OLTs</b> di sidebar kiri, lalu klik tombol{' '}
                  <span className="rounded bg-emerald-600/20 px-1.5 py-0.5 font-bold text-emerald-300">
                    + Add OLT
                  </span>.
                </li>
                <li>
                  Isi data perangkat dummy:
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-slate-400">
                    <li><b>Name</b>: <code className="text-sky-300">OLT-LAB-C320</code></li>
                    <li><b>IP Address</b>: <code className="text-sky-300">10.10.10.2</code> · <b>Telnet Port</b>: <code className="text-sky-300">23</code></li>
                    <li><b>Username / Password</b>: akun Telnet OLT (contoh <code className="text-amber-300">zte / zxr10</code>)</li>
                    <li><b>Enable Password</b>: password mode <code className="text-amber-300">enable</code> OLT</li>
                    <li>
                      <b>Supported PON Types</b>: pilih <code className="text-emerald-300">GPON</code> (untuk GTGH/GTGO),{' '}
                      <code className="text-purple-300">EPON</code> (untuk ETGH/ETGO), atau{' '}
                      <code className="text-sky-300">GPON+EPON</code> (chassis campuran).
                    </li>
                  </ul>
                </li>
                <li>
                  Klik <b>Save OLT</b>, lalu klik <b>Sync Data &amp; Config dari OLT (Telnet)</b> agar seluruh card, port PON, uplink, VLAN, dan ONU eksisting langsung terbaca otomatis.
                </li>
              </ol>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-800 bg-[#0e1624] p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Network className="h-4 w-4 text-emerald-400" />
                Langkah 2 — Buat VLAN, Tag ke Uplink &amp; Aktifkan PON Port
              </h3>
              <ol className="list-decimal space-y-2 pl-4 text-slate-300">
                <li>
                  Masuk ke detail OLT → tab <b className="text-white">VLANs</b> → klik <b>Add VLAN</b> untuk mendaftarkan VLAN <code className="text-sky-300">100, 101, 102, 999</code>. Centang <i>Used for Mgmt/TR069</i> khusus VLAN 100.
                </li>
                <li>
                  Pindah ke tab <b className="text-white">Uplink</b> → klik <b>Configure</b> pada <code className="text-sky-300">xgei_1/19/1</code> → pilih Mode <b>Hybrid</b> → centang seluruh VLAN (100, 101, 102, 999) → klik <b>Save &amp; Tag VLANs on Uplink</b>.
                </li>
                <li>
                  Pindah ke tab <b className="text-white">PON ports</b> → pilih Slot <code className="text-emerald-300">GTGH (GPON)</code> atau <code className="text-purple-300">ETGH (EPON)</code> → klik <b>Enable</b> atau <b>Configure</b> untuk mengirim <code className="text-emerald-300">no shutdown</code> dan <code className="text-emerald-300">linktrap enable</code> ke OLT.
                </li>
                <li>
                  Siapkan data pendukung sebelum registrasi pelanggan: menu <b>Speed &amp; ONU Types</b>, <b>Zones</b>, <b>Sectors (RK)</b>, <b>Splitters (ODP)</b>, serta akun teknisi di <b>Users &amp; Hak Akses</b>.
                </li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {renderCodeBlock(
              'uplink-cli',
              'Contoh CLI ZTE — Registrasi VLAN & Tag Uplink xgei_1/19/1',
              UPLINK_SAMPLE_CLI
            )}
            {renderCodeBlock(
              'pon-enable-cli',
              'Contoh CLI ZTE — Aktivasi Port PON GTGH (GPON) & ETGH (EPON)',
              PON_ENABLE_SAMPLE_CLI
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: REGISTRASI ONU (GPON & EPON) + SIMULATOR DUMMY             */}
      {/* ================================================================= */}
      {activeTab === 'ONU_AUTHORIZE' && (
        <div className="space-y-5">
          {renderImageCard(
            onuAuthorizeImg,
            'Gambar 4 — Alur Registrasi / Authorize ONU (Detect → Configure → Online Verified)',
            'Proses otorisasi ONU mulai dari deteksi otomatis Serial Number / MAC unconfigured, pemilihan mode Routing PPPoE / Bridge & VLAN, hingga verifikasi redaman optik Working.'
          )}

          {/* Langkah Authorize */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                step: 'STEP 1 · DETEKSI UNCFG',
                title: 'Colok Kabel Fiber & Scan ONU',
                body: 'Buka menu Unconfigured ONUs lalu klik Scan Live. OLT otomatis menjalankan show gpon onu uncfg (slot GTGH) dan show onu unauthentication (slot ETGH).',
                accent: 'border-sky-500/40 bg-sky-950/15 text-sky-300',
              },
              {
                step: 'STEP 2 · AUTHORIZE & PROFIL',
                title: 'Isi Mode, VLAN, PPPoE & ODP',
                body: 'Klik Authorize pada ONU yang muncul. Pilih Mode Routing (PPPoE + WiFi + TR-069) atau Bridging, pilih VLAN 101/102, Speed Profile 50M, serta lokasi Zone/RK/ODP.',
                accent: 'border-emerald-500/40 bg-emerald-950/15 text-emerald-300',
              },
              {
                step: 'STEP 3 · AUTO-PROVISIONING',
                title: 'Zero-Touch Opsional via Task',
                body: 'Untuk aktivasi otomatis tanpa klik manual, buat aturan di menu Auto-Provisioning Tasks berdasarkan OLT, Board, PON, Vendor/Model, dan template PPPoE.',
                accent: 'border-purple-500/40 bg-purple-950/15 text-purple-300',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-slate-800 bg-[#0e1624] p-4"
              >
                <span
                  className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${item.accent}`}
                >
                  {item.step}
                </span>
                <h4 className="mt-2 text-sm font-bold text-white">{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Dummy ONU CLI Simulator */}
          <div className="rounded-xl border border-sky-500/40 bg-[#0d1829] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  Simulator Alat Dummy — Preview CLI Authorize GPON (GTGH) vs EPON (ETGH)
                </h3>
              </div>
              <span className="rounded bg-sky-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-sky-300">
                Generated Real-Time dari Engine Aplikasi
              </span>
            </div>

            {/* Preset Switcher */}
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {DUMMY_ONU_PRESETS.map((preset) => {
                const active = preset.id === selectedPreset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`rounded-lg border p-3 text-left transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-md'
                        : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold text-sky-400">
                        {preset.badge}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400">
                        {preset.rxDbm}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-bold text-white">
                      {preset.onuType} · {preset.customerName}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-amber-300">
                      {preset.tech === 'EPON' ? 'MAC: ' : 'SN: '}
                      {preset.serialNumber}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      {preset.ponInterface}:{preset.onuIndex} · VLAN {preset.vlanId}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Dummy Metadata + Uncfg Output + Full CLI */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="space-y-3 lg:col-span-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                  <div className="text-[11px] font-bold text-sky-300">
                    Parameter Form Authorize (Alat Dummy Terpilih)
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                    <span className="text-slate-400">Board / Teknologi</span>
                    <span className="font-mono font-bold text-white">
                      {selectedPreset.boardModel} ({selectedPreset.tech})
                    </span>
                    <span className="text-slate-400">PON Interface</span>
                    <span className="font-mono text-sky-300">
                      {selectedPreset.ponInterface}:{selectedPreset.onuIndex}
                    </span>
                    <span className="text-slate-400">
                      {selectedPreset.tech === 'EPON' ? 'MAC Address' : 'Serial Number'}
                    </span>
                    <span className="font-mono text-amber-300">
                      {selectedPreset.serialNumber}
                    </span>
                    <span className="text-slate-400">Mode Layanan</span>
                    <span className="font-bold text-emerald-300">
                      {selectedPreset.onuMode} ({selectedPreset.wanMode})
                    </span>
                    <span className="text-slate-400">VLAN / Speed</span>
                    <span className="font-mono text-white">
                      VLAN {selectedPreset.vlanId} · {selectedPreset.speedProfile}
                    </span>
                    <span className="text-slate-400">ODP / Lokasi</span>
                    <span className="text-slate-200">{selectedPreset.odp}</span>
                    {selectedPreset.pppoeUsername && (
                      <>
                        <span className="text-slate-400">Akun PPPoE</span>
                        <span className="font-mono text-emerald-300">
                          {selectedPreset.pppoeUsername}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {renderCodeBlock(
                  `uncfg-${selectedPreset.id}`,
                  `Output Deteksi OLT (# ${selectedPreset.uncfgCommand})`,
                  selectedPreset.uncfgSampleOutput
                )}
              </div>

              <div className="lg:col-span-3">
                {renderCodeBlock(
                  `auth-cli-${selectedPreset.id}`,
                  `Script CLI Authorize Otomatis — ${selectedPreset.onuType} (${selectedPreset.boardModel})`,
                  generatedDummyCli
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: VERIFIKASI, MONITORING & TROUBLESHOOTING                   */}
      {/* ================================================================= */}
      {activeTab === 'TROUBLESHOOTING' && (
        <div className="space-y-5">
          {/* Optical Power Standards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>Sinyal Optimal (-15 s/d -24 dBm)</span>
              </div>
              <p className="mt-1.5 text-slate-300">
                Status ONU <b>Working</b>, trafik PPPoE stabil tanpa packet loss. Contoh dummy: <code className="font-mono text-emerald-300">-19.45 dBm</code>.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span>Sinyal Warning (-25 s/d -27 dBm)</span>
              </div>
              <p className="mt-1.5 text-slate-300">
                Koneksi rentan putus-nyambung. Periksa konektor SC/APC di ODP, kotoran ujung pigtail, atau tekukan tajam kabel dropcore.
              </p>
            </div>
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="h-4 w-4" />
                <span>Kritis / Offline (&lt; -28 dBm / LOS)</span>
              </div>
              <p className="mt-1.5 text-slate-300">
                <b>LOS</b> = kabel fiber putus/tercabut; <b>DyingGasp</b> = adaptor listrik ONU pelanggan mati/padam.
              </p>
            </div>
          </div>

          {/* Checklist Troubleshooting */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0e1624]">
            <div className="border-b border-slate-800 bg-[#121d30] px-4 py-3 font-bold text-white">
              Checklist Troubleshooting Cepat (GPON GTGH &amp; EPON ETGH)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Gejala / Masalah</th>
                    <th className="px-4 py-2.5">Penyebab Umum</th>
                    <th className="px-4 py-2.5">Perintah Cek / Solusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-amber-300">ONU tidak muncul di Unconfigured</td>
                    <td className="px-4 py-2.5">Port PON masih <code className="text-rose-300">shutdown</code> atau redaman &lt; -28 dBm</td>
                    <td className="px-4 py-2.5">
                      Cek <code className="font-mono text-sky-300">show running-config interface gpon-olt_1/3/1</code> (atau <code className="font-mono text-purple-300">epon-olt_1/2/1</code>), pastikan <code className="text-emerald-300">no shutdown</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-amber-300">ONU Working tapi PPPoE tidak dial</td>
                    <td className="px-4 py-2.5">VLAN 101 belum di-tag pada port Uplink <code className="text-sky-300">xgei_1/19/1</code></td>
                    <td className="px-4 py-2.5">
                      Buka tab <b>Uplink → Configure</b>, pastikan VLAN 101 ter-tag (`switchport vlan 101 tag`) dan PPPoE Server di MikroTik aktif pada VLAN 101.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-amber-300">Sesi Telnet OLT terkunci (max session)</td>
                    <td className="px-4 py-2.5">Login paralel dari banyak terminal/aplikasi lain bersamaan</td>
                    <td className="px-4 py-2.5">
                      Aplikasi sudah memakai antrean serial (max 1 VTY/OLT) dan jeda otomatis jika lockout terdeteksi. Hindari membuka banyak sesi Telnet manual bersamaan dengan akun yang sama.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-amber-300">Mode EPON (ETGH) gagal authorize</td>
                    <td className="px-4 py-2.5">Format MAC salah atau index ONU melebihi 64</td>
                    <td className="px-4 py-2.5">
                      Gunakan format MAC ZTE <code className="font-mono text-sky-300">xxxx.xxxx.xxxx</code> dan pastikan slot terdeteksi sebagai card <b>ETGH/ETGO</b> (maks 64 ONU per port).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {renderCodeBlock(
            'verify-cli',
            'Perintah Verifikasi Harian di OLT ZTE (GPON & EPON)',
            `! Cek daftar kartu & status operasional
show card
! Cek status seluruh ONU GPON & EPON
show gpon onu state
show onu all-status
! Cek redaman optik RX pada PON Port
show pon power onu-rx gpon-olt_1/3/1
show pon power onu-rx epon-olt_1/2/1
! Cek konfigurasi uplink & VLAN tag
show running-config interface xgei_1/19/1
! Cek detail 1 ONU (GPON / EPON)
show gpon onu detail-info gpon-onu_1/3/1:1
show onu detail-info epon-onu_1/2/1:1`
          )}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0f172a] shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="text-xs font-bold text-white sm:text-sm">
                {zoomedImage.title}
              </span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-950 p-2 sm:p-4">
              <img
                src={zoomedImage.src}
                alt={zoomedImage.title}
                referrerPolicy="no-referrer"
                className="mx-auto max-h-[78vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
