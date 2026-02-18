import { AxiosError } from 'axios'

import { DownloaderClass } from '../../src/Downloader.js'
import MediaWiki from '../../src/MediaWiki.js'

const createDownloader = () => {
  MediaWiki.reset()
  MediaWiki.base = 'https://example.org'

  const downloader = new DownloaderClass()
  downloader.init = {
    uaString: 'mwoffliner-test-agent',
    speed: 1,
    reqTimeout: 1000,
    optimisationCacheUrl: '',
    webp: false,
  }

  return downloader
}

describe('Downloader malformed JSON retry strategy', () => {
  test('enables strict JSON parsing', () => {
    const downloader = createDownloader()
    expect((downloader as any).jsonRequestOptions.transitional).toEqual({
      silentJSONParsing: false,
      forcedJSONParsing: true,
    })
  })

  test('retries malformed JSON parse failures from axios', () => {
    const downloader = createDownloader()
    const retryIf = (downloader as any).backoffOptions.retryIf as (error?: any) => boolean
    const err = new AxiosError('Expected double-quoted property name in JSON at position 21', AxiosError.ERR_BAD_RESPONSE)

    expect(retryIf(err)).toBe(true)
  })

  test('retries malformed JSON parse failures when wrapped in cause', () => {
    const downloader = createDownloader()
    const retryIf = (downloader as any).backoffOptions.retryIf as (error?: any) => boolean
    const err = new AxiosError('Failed to parse API response', AxiosError.ERR_BAD_RESPONSE)
    ;(err as any).cause = new SyntaxError('Unexpected end of JSON input')

    expect(retryIf(err)).toBe(true)
  })

  test('does not retry non-transient bad responses', () => {
    const downloader = createDownloader()
    const retryIf = (downloader as any).backoffOptions.retryIf as (error?: any) => boolean
    const err = new AxiosError('Request failed with status code 418', AxiosError.ERR_BAD_RESPONSE)
    ;(err as any).response = { status: 418 }

    expect(retryIf(err)).toBe(false)
  })
})
