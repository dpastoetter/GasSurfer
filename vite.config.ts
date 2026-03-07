import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/api/rpc/eth': { target: 'https://ethereum.publicnode.com', changeOrigin: true, rewrite: () => '/', secure: true },
      '/api/rpc/base': { target: 'https://mainnet.base.org', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/arbitrum': { target: 'https://arb1.arbitrum.io', changeOrigin: true, rewrite: () => '/rpc' },
      '/api/rpc/polygon': { target: 'https://polygon.llamarpc.com', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/optimism': { target: 'https://mainnet.optimism.io', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/bsc': { target: 'https://bsc-dataseed.binance.org', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/avax': { target: 'https://api.avax.network/ext/bc/C/rpc', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/fantom': { target: 'https://fantom.llamarpc.com', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/linea': { target: 'https://rpc.linea.build', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/gnosis': { target: 'https://rpc.gnosischain.com', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/zksync': { target: 'https://zksync.drpc.org', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/mantle': { target: 'https://rpc.mantle.xyz', changeOrigin: true, rewrite: () => '/' },
      '/api/rpc/celo': { target: 'https://celo.llamarpc.com', changeOrigin: true, rewrite: () => '/' },
    },
  },
})
