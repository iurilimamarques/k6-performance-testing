import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getContactsDuration = new Trend('get_contacts', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    // 90% das respostas com tempo abaixo de 6800ms
    http_req_duration: ['p(90)<6800'],
    // menos de 25% das requisicoes podem dar erro
    http_req_failed: ['rate<0.25']
  },
  stages: [
    { duration: '70s', target: 7 }, // sobe ate 7 VUs
    { duration: '70s', target: 92 }, // sobe ate o maximo de 92 VUs
    { duration: '70s', target: 0 } // desce ate 0 (total 3.5 min)
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://martinfowler.com/microservices/';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}`, params);

  getContactsDuration.add(res.timings.duration);

  RateContentOK.add(res.status === OK);

  check(res, {
    'GET Contacts - Status 200': () => res.status === OK
  });
}
