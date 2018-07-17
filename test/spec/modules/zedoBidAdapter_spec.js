import { expect } from 'chai';
import { spec } from 'modules/zedoBidAdapter';

describe('The ZEDO bidding adapter', () => {
  describe('isBidRequestValid', () => {
    it('should return false when given an invalid bid', () => {
      const bid = {
        bidder: 'zedo',
      };
      const isValid = spec.isBidRequestValid(bid);
      expect(isValid).to.equal(false);
    });

    it('should return true when given a channelcode bid', () => {
      const bid = {
        bidder: 'zedo',
        params: {
          channelCode: 20000000,
          dimId: 9
        },
      };
      const isValid = spec.isBidRequestValid(bid);
      expect(isValid).to.equal(true);
    });
  });

  describe('buildRequests', () => {
    const bidderRequest = {
      timeout: 3000,
    };

    it('should properly build a channelCode request for banner', () => {
      const bidRequests = [
        {
          bidder: 'zedo',
          adUnitCode: 'p12345',
          transactionId: '12345667',
          sizes: [[300, 250]],
          params: {
            channelCode: 20000000,
            dimId: 9
          },
        },
      ];
      const request = spec.buildRequests(bidRequests, bidderRequest);
      expect(request.url).to.match(/^\/\/z2.zedo.com\/asw\/fmb.json/);
      expect(request.method).to.equal('GET');
      const zedoRequest = request.data;
      expect(zedoRequest).to.equal('g={"placements":[{"network":20,"channel":0,"width":300,"height":250,"dimension":9,"version":"$prebid.version$","keyword":"","transactionId":"12345667","renderers":[{"name":"display"}]}]}');
    });

    it('should properly build a channelCode request for video', () => {
      const bidRequests = [
        {
          bidder: 'zedo',
          adUnitCode: 'p12345',
          transactionId: '12345667',
          sizes: [640, 480],
          mediaTypes: {
            video: {
              context: 'instream',
            },
          },
          params: {
            channelCode: 20000000,
            dimId: 85
          },
        },
      ];
      const request = spec.buildRequests(bidRequests, bidderRequest);
      expect(request.url).to.match(/^\/\/z2.zedo.com\/asw\/fmb.json/);
      expect(request.method).to.equal('GET');
      const zedoRequest = request.data;
      expect(zedoRequest).to.equal('g={"placements":[{"network":20,"channel":0,"width":640,"height":480,"dimension":85,"version":"$prebid.version$","keyword":"","transactionId":"12345667","renderers":[{"name":"Pre/Mid/Post roll"}]}]}');
    });
  });
  describe('interpretResponse', () => {
    it('should return an empty array when there is bid response', () => {
      const response = {};
      const request = { bidRequests: [] };
      const bids = spec.interpretResponse(response, request);
      expect(bids).to.have.lengthOf(0);
    });

    it('should properly parse a bid response with no valid creative', () => {
      const response = {
        body: {
          ad: [
            {
              'slotId': 'ad1d762',
              'network': '2000',
              'creatives': [
                {
                  'adId': '12345',
                  'height': '600',
                  'width': '160',
                  'isFoc': true,
                  'creativeDetails': {
                    'type': 'StdBanner',
                    'adContent': {
                      'focImage': {
                        'url': 'https://c13.zedo.com/OzoDB/0/0/0/blank.gif',
                        'target': '_blank',
                      }
                    }
                  },
                  'cpm': '0'
                }
              ]
            }
          ]
        }
      };
      const request = {
        bidRequests: [{
          bidder: 'zedo',
          adUnitCode: 'p12345',
          bidId: 'test-bidId',
          params: {
            channelCode: 2000000,
            dimId: 9
          }
        }]
      };
      const bids = spec.interpretResponse(response, request);
      expect(bids).to.have.lengthOf(0);
    });

    it('should properly parse a bid response with valid creative', () => {
      const response = {
        body: {
          ad: [
            {
              'slotId': 'ad1d762',
              'network': '2000',
              'creatives': [
                {
                  'adId': '12345',
                  'height': '600',
                  'width': '160',
                  'isFoc': true,
                  'creativeDetails': {
                    'type': 'StdBanner',
                    'adContent': '<a href="some_path"></a>'
                  },
                  'cpm': '1200000'
                }
              ]
            }
          ]
        }
      };
      const request = {
        bidRequests: [{
          bidder: 'zedo',
          adUnitCode: 'test-requestId',
          bidId: 'test-bidId',
          params: {
            channelCode: 2000000,
            dimId: 9
          },
        }]
      };
      const bids = spec.interpretResponse(response, request);
      expect(bids).to.have.lengthOf(1);
      expect(bids[0].requestId).to.equal('ad1d762');
      expect(bids[0].cpm).to.equal(0.84);
      expect(bids[0].width).to.equal('160');
      expect(bids[0].height).to.equal('600');
    });
  });
});
