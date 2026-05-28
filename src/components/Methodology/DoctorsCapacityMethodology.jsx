export default function DoctorsCapacityMethodology() {
  return (
    <div className="space-y-6 text-xs md:text-sm leading-relaxed p-4 md:p-8 pt-2">
      <section>
        <h3 className="text-base md:text-lg font-semibold mb-2">Цель</h3>
        <p>
          Основная цель методологии – обеспечить контроль и оптимизацию распределения государственных заказов и участков
          обслуживания в поликлиниках города Алматы. Также методология предусматривает визуализацию данных на карте города с
          указанием половозрастного состава населения, площади поликлиник и их мощности.
        </p>
      </section>

      <section>
        <h3 className="text-base md:text-lg font-semibold mb-2">Нормативы нагрузки на врачей</h3>
        <p className="mb-2">
          В соответствии с действующими стандартами, расчет мощности поликлиники осуществляется исходя из нормативной
          нагрузки на одного врача:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Врач общей практики (ВОП): до 1 700 человек (смешанное население);</li>
          <li>Участковый терапевт: до 2 200 взрослых;</li>
          <li>Участковый педиатр: до 900 детей;</li>
          <li>На одного педиатра, терапевта – 2 медсестры;</li>
          <li>На одного ВОП – 3 медсестры.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base md:text-lg font-semibold mb-2">Формулы расчетов</h3>

        <ol className="list-decimal pl-6 space-y-4">
          <li>
            <strong>Мощность поликлиники:</strong>
            <pre className="bg-gray-100 p-2 rounded-md mt-2 overflow-x-auto text-[10px] md:text-xs">
{`M = Σ (Nᵢ × Kᵢ)`}</pre>
            <p className="mt-2">
              где:<br />
              Nᵢ – количество врачей по специальности i;<br />
              Kᵢ – нормативная нагрузка на одного врача по специальности i.<br /><br />
              для врача общей практики: K<sub>ВОП</sub> = a;<br />
              для участкового терапевта: K<sub>Терапевт</sub> = b;<br />
              для участкового педиатра: K<sub>Педиатр</sub> = c.
            </p>
          </li>

          <li>
            <strong>Загруженность:</strong>
            <pre className="bg-gray-100 p-2 rounded-md mt-2 overflow-x-auto text-[10px] md:text-xs">{`Z = M / F`}</pre>
            <p className="mt-2">
              где:<br />
              M – расчетная мощность поликлиники;<br />
              F – фактическое прикрепленное население.
            </p>
          </li>

          <li>
            <strong>Дефицит врачей (в пересчете на ВОП):</strong>
            <pre className="bg-gray-100 p-2 rounded-md mt-2 overflow-x-auto text-[10px] md:text-xs">{`D = (M - F) / 1700`}</pre>
            <p className="mt-2">
              где результат показывает, сколько врачей общей практики эквивалентно необходимо дополнительно для покрытия
              дефицита.
            </p>
          </li>
        </ol>
      </section>

      <section>
        <h3 className="text-base md:text-lg font-semibold mb-2">Инфраструктура</h3>
        <p className="mb-2">
          Интегральный индекс (далее — Индекс) представляет собой комплексный показатель, отражающий степень соответствия
          условий функционирования поликлиники нормативам по площади, нагрузке, собственности, типу здания и его состоянию.
          Значение Индекса используется для оценки уровня комфортности учреждения для прикреплённого населения и приоритизации
          мер по улучшению инфраструктуры.
        </p>

        <pre className="bg-gray-100 p-2 rounded-md mt-2 overflow-x-auto text-[10px] md:text-xs">{`Index = w₁ × (area_per_person/norm_area) + w₂ × (visits_per_person/norm_visits) + w₃ × ownership_score + w₄ × building_type_score + w₅ × condition_score)`}</pre>

        <p className="mt-2">
          где:<br />
          <strong>area_per_person</strong> — обеспеченность площадью на одного прикреплённого жителя, м²/чел., рассчитывается как:<br />
        </p>
        <pre className="bg-gray-100 p-2 rounded-md mt-2 overflow-x-auto text-[10px] md:text-xs">{`area_per_person = площадь / прикреплённое население`}</pre>

        <p className="mt-2">
          <strong>norm_area</strong> — норматив обеспеченности площадью (0,65 м²/чел. по СНиП).<br /><br />
          <strong>visits_per_person</strong> — количество посещений на одного прикреплённого жителя за период наблюдения:<br />
        </p>
        <pre className="bg-gray-100 p-2 rounded-md mt-2 overflow-x-auto text-[10px] md:text-xs">{`visits_per_person = посещения / прикреплённое население`}</pre>

        <p className="mt-2">
          <strong>norm_visits</strong> — норматив посещаемости. Пример: 4–5 посещений за 5 месяцев или 10–12 посещений в год.
        </p>

        <ul className="list-disc pl-6 mt-3 space-y-1">
          <li><strong>ownership_score</strong> — показатель права собственности:
            <ul className="list-disc pl-6">
              <li>1.0 — объект на балансе;</li>
              <li>0.5 — арендуемое помещение.</li>
            </ul>
          </li>
          <li><strong>building_type_score</strong> — показатель типа здания:
            <ul className="list-disc pl-6">
              <li>1.0 — отдельное здание;</li>
              <li>0.7 — часть здания (встроенно-пристроенное помещение).</li>
            </ul>
          </li>
          <li><strong>condition_score</strong> — показатель состояния здания, основанный на его возрасте:
            <ul className="list-disc pl-6">
              <li>если (2025 – год постройки) &lt; 40 лет → 1.0</li>
              <li>если 40–60 лет → 0.7</li>
              <li>если &gt; 60 лет → 0.4</li>
            </ul>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-base md:text-lg font-semibold mb-2">Весовые коэффициенты</h3>
        <table className="w-full border border-gray-300 text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Показатель</th>
              <th className="border p-2 text-left">Вес (wᵢ)</th>
              <th className="border p-2 text-left">Значимость</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border p-2">Площадь на одного жителя</td><td className="border p-2">w₁ = 0.30</td><td className="border p-2">Ключевой фактор обеспеченности</td></tr>
            <tr><td className="border p-2">Посещаемость на одного жителя</td><td className="border p-2">w₂ = 0.30</td><td className="border p-2">Характеризует нагрузку</td></tr>
            <tr><td className="border p-2">Право собственности</td><td className="border p-2">w₃ = 0.15</td><td className="border p-2">Отражает устойчивость владения</td></tr>
            <tr><td className="border p-2">Тип здания</td><td className="border p-2">w₄ = 0.15</td><td className="border p-2">Определяет уровень инфраструктурной самостоятельности</td></tr>
            <tr><td className="border p-2">Состояние здания</td><td className="border p-2">w₅ = 0.10</td><td className="border p-2">Влияет на комфорт и долговечность</td></tr>
          </tbody>
        </table>
        <p className="mt-2 text-gray-700 font-medium">Сумма весов: w₁ + w₂ + w₃ + w₄ + w₅ = 1</p>
      </section>

      <section>
        <h3 className="text-base md:text-lg font-semibold mb-2">Интерпретация результатов</h3>
        <table className="w-full border border-gray-300 text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Значение Индекса</th>
              <th className="border p-2 text-left">Классификация</th>
              <th className="border p-2 text-left">Интерпретация</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Index ≥ 0.8</td>
              <td className="border p-2">Нормальная</td>
              <td className="border p-2">Поликлиника соответствует нормативам, обеспечивает комфортное обслуживание населения</td>
            </tr>
            <tr>
              <td className="border p-2">0.6 ≤ Index &lt; 0.8</td>
              <td className="border p-2">Условно нормальная</td>
              <td className="border p-2">Требуются точечные улучшения (доп. площади, ремонты, оптимизация нагрузки)</td>
            </tr>
            <tr>
              <td className="border p-2">Index &lt; 0.6</td>
              <td className="border p-2">Ненормальная</td>
              <td className="border p-2">Инфраструктура неудовлетворительная, перегрузка или риски аренды</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}