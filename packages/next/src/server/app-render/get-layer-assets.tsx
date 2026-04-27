import React from 'react'
import { getLinkAndScriptTags } from './get-css-inlined-link-tags'
import { getPreloadableFonts } from './get-preloadable-fonts'
import type { AppRenderContext } from './app-render'
import { getAssetQueryString } from './get-asset-query-string'
import { encodeURIPath } from '../../shared/lib/encode-uri-path'
import { renderCssResource } from './render-css-resource'

export function getLayerAssets({
  ctx,
  layoutOrPagePath,
  injectedCSS: injectedCSSWithCurrentLayout,
  injectedJS: injectedJSWithCurrentLayout,
  injectedFontPreloadTags: injectedFontPreloadTagsWithCurrentLayout,
}: {
  layoutOrPagePath: string | undefined
  injectedCSS: Set<string>
  injectedJS: Set<string>
  injectedFontPreloadTags: Set<string>
  ctx: AppRenderContext
}): React.ReactNode {
  const { styles: styleTags, scripts: scriptTags } = layoutOrPagePath
    ? getLinkAndScriptTags(
        ctx.clientReferenceManifest,
        layoutOrPagePath,
        injectedCSSWithCurrentLayout,
        injectedJSWithCurrentLayout,
        true
      )
    : { styles: [], scripts: [] }

  const preloadedFontFiles = layoutOrPagePath
    ? getPreloadableFonts(
        ctx.renderOpts.nextFontManifest,
        layoutOrPagePath,
        injectedFontPreloadTagsWithCurrentLayout
      )
    : null

  if (preloadedFontFiles) {
    if (preloadedFontFiles.length) {
      for (let i = 0; i < preloadedFontFiles.length; i++) {
        const fontFilename = preloadedFontFiles[i]
        const ext = /\.(woff|woff2|eot|ttf|otf)$/.exec(fontFilename)![1]
        const type = `font/${ext}`
        const href = `${ctx.assetPrefix}/_next/${encodeURIPath(fontFilename)}`
        ctx.componentMod.preloadFont(href, type, ctx.renderOpts.crossOrigin)
      }
    } else {
      try {
        let url = new URL(ctx.assetPrefix)
        ctx.componentMod.preconnect(url.origin, 'anonymous')
      } catch (error) {
        // assetPrefix must not be a fully qualified domain name. We assume
        // we should preconnect to same origin instead
        ctx.componentMod.preconnect('/', 'anonymous')
      }
    }
  }

  const styles = renderCssResource(styleTags, ctx, true)

  const scripts = scriptTags
    ? scriptTags.map((href, index) => {
        const fullSrc = `${ctx.assetPrefix}/_next/${encodeURIPath(
          href
        )}${getAssetQueryString(ctx, true)}`

        return <script src={fullSrc} async={true} key={`script-${index}`} />
      })
    : []

  return styles.length || scripts.length ? [...styles, ...scripts] : null
}
